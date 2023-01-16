import {
	IRunExecutionData,
	ITaskData,
	LoggerProxy,
	MessageEventBusDestinationOptions,
	NodeOperationError,
	WorkflowOperationError,
} from 'n8n-workflow';
import { DeleteResult } from 'typeorm';
import { EventMessageTypes } from '../EventMessageClasses/';
import type { MessageEventBusDestination } from '../MessageEventBusDestination/MessageEventBusDestination.ee';
import { MessageEventBusLogWriter } from '../MessageEventBusWriter/MessageEventBusLogWriter';
import EventEmitter from 'events';
import config from '@/config';
import * as Db from '@/Db';
import { messageEventBusDestinationFromDb } from '../MessageEventBusDestination/Helpers.ee';
import uniqby from 'lodash.uniqby';
import { EventMessageConfirmSource } from '../EventMessageClasses/EventMessageConfirm';
import {
	EventMessageAuditOptions,
	EventMessageAudit,
} from '../EventMessageClasses/EventMessageAudit';
import {
	EventMessageWorkflowOptions,
	EventMessageWorkflow,
} from '../EventMessageClasses/EventMessageWorkflow';
import { isLogStreamingEnabled } from './MessageEventBusHelper';
import { EventMessageNode, EventMessageNodeOptions } from '../EventMessageClasses/EventMessageNode';
import {
	EventMessageGeneric,
	eventMessageGenericDestinationTestEvent,
} from '../EventMessageClasses/EventMessageGeneric';
import { parse, stringify } from 'flatted';

export type EventMessageReturnMode = 'sent' | 'unsent' | 'all' | 'unfinished';

export interface MessageWithCallback {
	msg: EventMessageTypes;
	confirmCallback: (message: EventMessageTypes, src: EventMessageConfirmSource) => void;
}

export class MessageEventBus extends EventEmitter {
	private static instance: MessageEventBus;

	isInitialized: boolean;

	logWriter: MessageEventBusLogWriter;

	destinations: {
		[key: string]: MessageEventBusDestination;
	} = {};

	private pushIntervalTimer: NodeJS.Timer;

	constructor() {
		super();
		this.isInitialized = false;
	}

	static getInstance(): MessageEventBus {
		if (!MessageEventBus.instance) {
			MessageEventBus.instance = new MessageEventBus();
		}
		return MessageEventBus.instance;
	}

	/**
	 * Needs to be called once at startup to set the event bus instance up. Will launch the event log writer and,
	 * if configured to do so, the previously stored event destinations.
	 *
	 * Will check for unsent event messages in the previous log files once at startup and try to re-send them.
	 *
	 * Sets `isInitialized` to `true` once finished.
	 */
	async initialize() {
		if (this.isInitialized) {
			return;
		}

		LoggerProxy.debug('Initializing event bus...');

		const savedEventDestinations = await Db.collections.EventDestinations.find({});
		if (savedEventDestinations.length > 0) {
			for (const destinationData of savedEventDestinations) {
				try {
					const destination = messageEventBusDestinationFromDb(this, destinationData);
					if (destination) {
						await this.addDestination(destination);
					}
				} catch (error) {
					console.log(error);
				}
			}
		}

		LoggerProxy.debug('Initializing event writer');
		this.logWriter = await MessageEventBusLogWriter.getInstance();

		// unsent event check:
		// - find unsent messages in current event log(s)
		// - cycle event logs and start the logging to a fresh file
		// - retry sending events
		LoggerProxy.debug('Checking for unsent event messages');
		const unsentAndUnfinished = await this.getUnsentAndUnfinishedExecutions();
		LoggerProxy.debug(
			`Start logging into ${this.logWriter?.getLogFileName() ?? 'unknown filename'} `,
		);
		this.logWriter?.startLogging();
		await this.send(unsentAndUnfinished.unsentMessages);

		// console.error(unsentAndUnfinished.unfinishedExecutions);

		if (Object.keys(unsentAndUnfinished.unfinishedExecutions).length > 0) {
			for (const executionId of Object.keys(unsentAndUnfinished.unfinishedExecutions)) {
				await this.recoverExecutionDataFromEventLog(
					executionId,
					unsentAndUnfinished.unfinishedExecutions[executionId],
				);

				// if (!executionEntry?.stoppedAt) {
				// 	LoggerProxy.debug(`Found unfinished execution ${executionId}, marking them as failed`);
				// 	await Db.collections.Execution.update(executionId, {
				// 		finished: false,
				// 		stoppedAt: new Date(),
				// 	});
				// } else {
				// 	LoggerProxy.debug(
				// 		`Found unfinished execution ${executionId}, but it was already marked as failed`,
				// 	);
				// }
			}
		}

		// if configured, run this test every n ms
		if (config.getEnv('eventBus.checkUnsentInterval') > 0) {
			if (this.pushIntervalTimer) {
				clearInterval(this.pushIntervalTimer);
			}
			this.pushIntervalTimer = setInterval(async () => {
				await this.trySendingUnsent();
			}, config.getEnv('eventBus.checkUnsentInterval'));
		}

		LoggerProxy.debug('MessageEventBus initialized');
		this.isInitialized = true;
	}

	async recoverExecutionDataFromEventLog(
		executionId: string,
		messages: EventMessageTypes[],
		applyToDb = true,
	): Promise<IRunExecutionData | undefined> {
		const executionEntry = await Db.collections.Execution.findOne({
			where: {
				id: executionId,
			},
		});
		console.log(executionId, messages, executionEntry);

		if (executionEntry && messages) {
			const executionData: IRunExecutionData | undefined = executionEntry?.data
				? (parse(executionEntry.data) as IRunExecutionData)
				: { resultData: { runData: {} } };
			let nodeNames: string[] = [];
			if (
				executionData.resultData?.runData &&
				Object.keys(executionData.resultData.runData).length > 0
			) {
				nodeNames = Object.keys(executionData.resultData.runData);
			} else {
				if (!executionData.resultData) {
					executionData.resultData = {
						runData: {},
					};
				} else {
					executionData.resultData.runData = {};
				}
				nodeNames = executionEntry.workflowData.nodes.map((n) => n.name);
			}

			for (const nodeName of nodeNames) {
				const nodeByName = executionEntry?.workflowData.nodes.find((n) => n.name === nodeName);

				if (!nodeByName) continue;

				if (['n8n-nodes-base.start', 'n8n-nodes-base.manualTrigger'].includes(nodeByName.type))
					continue;

				const nodeStartedMessage = messages.find(
					(message) =>
						message.eventName === 'n8n.node.started' && message.payload.nodeName === nodeName,
				);
				const nodeFinishedMessage = messages.find(
					(message) =>
						message.eventName === 'n8n.node.finished' && message.payload.nodeName === nodeName,
				);

				const executionTime =
					nodeStartedMessage && nodeFinishedMessage
						? nodeFinishedMessage.ts.diff(nodeStartedMessage.ts).toMillis()
						: 0;

				const error = nodeByName
					? new NodeOperationError(nodeByName, 'Node did not finish, possible Out Of Memory issue?')
					: new WorkflowOperationError('Node did not finish, possible Out Of Memory issue?');

				const iRunData: ITaskData = {
					startTime: nodeStartedMessage ? nodeStartedMessage.ts.toUnixInteger() : 0,
					executionTime,
					source: [null],
				};

				if (!nodeFinishedMessage) {
					iRunData.error = error;
					executionData.resultData.lastNodeExecuted = nodeName;
				}

				executionData.resultData.runData[nodeName] = [iRunData];
			}
			if (applyToDb) {
				await Db.collections.Execution.update(executionId, { data: stringify(executionData) });
			}
			return executionData;
		}
		return;
	}

	async addDestination(destination: MessageEventBusDestination) {
		await this.removeDestination(destination.getId());
		this.destinations[destination.getId()] = destination;
		this.destinations[destination.getId()].startListening();
		return destination;
	}

	async findDestination(id?: string): Promise<MessageEventBusDestinationOptions[]> {
		let result: MessageEventBusDestinationOptions[];
		if (id && Object.keys(this.destinations).includes(id)) {
			result = [this.destinations[id].serialize()];
		} else {
			result = Object.keys(this.destinations).map((e) => this.destinations[e].serialize());
		}
		return result.sort((a, b) => (a.__type ?? '').localeCompare(b.__type ?? ''));
	}

	async removeDestination(id: string): Promise<DeleteResult | undefined> {
		let result;
		if (Object.keys(this.destinations).includes(id)) {
			await this.destinations[id].close();
			result = await this.destinations[id].deleteFromDb();
			delete this.destinations[id];
		}
		return result;
	}

	private async trySendingUnsent(msgs?: EventMessageTypes[]) {
		const unsentMessages = msgs ?? (await this.getEventsUnsent());
		if (unsentMessages.length > 0) {
			LoggerProxy.debug(`Found unsent event messages: ${unsentMessages.length}`);
			for (const unsentMsg of unsentMessages) {
				LoggerProxy.debug(`Retrying: ${unsentMsg.id} ${unsentMsg.__type}`);
				await this.emitMessage(unsentMsg);
			}
		}
	}

	async close() {
		LoggerProxy.debug('Shutting down event writer...');
		await this.logWriter?.close();
		for (const destinationName of Object.keys(this.destinations)) {
			LoggerProxy.debug(
				`Shutting down event destination ${this.destinations[destinationName].getId()}...`,
			);
			await this.destinations[destinationName].close();
		}
		LoggerProxy.debug('EventBus shut down.');
	}

	async send(msgs: EventMessageTypes | EventMessageTypes[]) {
		if (!Array.isArray(msgs)) {
			msgs = [msgs];
		}
		for (const msg of msgs) {
			this.logWriter?.putMessage(msg);
			// if there are no set up destinations, immediately mark the event as sent
			if (!this.shouldSendMsg(msg)) {
				this.confirmSent(msg, { id: '0', name: 'eventBus' });
			}
			await this.emitMessage(msg);
		}
	}

	async testDestination(destinationId: string): Promise<boolean> {
		const msg = new EventMessageGeneric({
			eventName: eventMessageGenericDestinationTestEvent,
		});
		const destination = await this.findDestination(destinationId);
		if (destination.length > 0) {
			const sendResult = await this.destinations[destinationId].receiveFromEventBus({
				msg,
				confirmCallback: () => this.confirmSent(msg, { id: '0', name: 'eventBus' }),
			});
			return sendResult;
		}
		return false;
	}

	confirmSent(msg: EventMessageTypes, source?: EventMessageConfirmSource) {
		this.logWriter?.confirmMessageSent(msg.id, source);
	}

	private hasAnyDestinationSubscribedToEvent(msg: EventMessageTypes): boolean {
		for (const destinationName of Object.keys(this.destinations)) {
			if (this.destinations[destinationName].hasSubscribedToEvent(msg)) {
				return true;
			}
		}
		return false;
	}

	private async emitMessage(msg: EventMessageTypes) {
		// generic emit for external modules to capture events
		// this is for internal use ONLY and not for use with custom destinations!
		this.emitMessageWithCallback('message', msg);
		// this.emit('message', [
		// 	msg,
		// 	(message: EventMessageTypes, src: EventMessageConfirmSource) =>
		// 		this.confirmSent(message, src),
		// ]);

		// LoggerProxy.debug(`Listeners: ${this.eventNames().join(',')}`);

		if (this.shouldSendMsg(msg)) {
			for (const destinationName of Object.keys(this.destinations)) {
				this.emitMessageWithCallback(this.destinations[destinationName].getId(), msg);
				// this.emit(this.destinations[destinationName].getId(), [
				// 	msg,
				// 	(message: EventMessageTypes, src: EventMessageConfirmSource) =>
				// 		this.confirmSent(message, src),
				// ]);
			}
		}
	}

	private emitMessageWithCallback(eventName: string, msg: EventMessageTypes): boolean {
		// return this.emit(eventName, msg, (message: EventMessageTypes, src: EventMessageConfirmSource) =>
		// 	this.confirmSent(message, src),
		// );
		// const emitterPayload: MessageWithCallback = {
		// 	msg,
		// 	confirmCallback: (message: EventMessageTypes, src: EventMessageConfirmSource) =>
		// 		this.confirmSent(message, src),
		// };
		const confirmCallback = (message: EventMessageTypes, src: EventMessageConfirmSource) =>
			this.confirmSent(message, src);
		return this.emit(eventName, msg, confirmCallback);
	}

	shouldSendMsg(msg: EventMessageTypes): boolean {
		return (
			isLogStreamingEnabled() &&
			Object.keys(this.destinations).length > 0 &&
			this.hasAnyDestinationSubscribedToEvent(msg)
		);
	}

	async getEventsAll(): Promise<EventMessageTypes[]> {
		const queryResult = await this.logWriter?.getMessagesAll();
		const filtered = uniqby(queryResult, 'id');
		return filtered;
	}

	async getEventsSent(): Promise<EventMessageTypes[]> {
		const queryResult = await this.logWriter?.getMessagesSent();
		const filtered = uniqby(queryResult, 'id');
		return filtered;
	}

	async getEventsUnsent(): Promise<EventMessageTypes[]> {
		const queryResult = await this.logWriter?.getMessagesUnsent();
		const filtered = uniqby(queryResult, 'id');
		return filtered;
	}

	async getUnfinishedExecutions(): Promise<Record<string, EventMessageTypes[]>> {
		const queryResult = await this.logWriter?.getUnfinishedExecutions();
		return queryResult;
	}

	async getUnsentAndUnfinishedExecutions(): Promise<{
		unsentMessages: EventMessageTypes[];
		unfinishedExecutions: Record<string, EventMessageTypes[]>;
	}> {
		const queryResult = await this.logWriter?.getUnsentAndUnfinishedExecutions();
		return queryResult;
	}

	/**
	 * This will pull all events for a given execution id from the event log files. Note that this can be a very expensive operation, depending on the number of events and the size of the log files.
	 * @param executionId id to look for
	 * @param logHistory defaults to 1, which means it will look at the current log file AND the previous one.
	 * @returns Array of EventMessageTypes
	 */
	async getEventsByExecutionId(
		executionId: string,
		logHistory?: number,
	): Promise<EventMessageTypes[]> {
		const result = await this.logWriter?.getMessagesByExecutionId(executionId, logHistory);
		return result;
	}
	/**
	 * Convenience Methods
	 */

	async sendAuditEvent(options: EventMessageAuditOptions) {
		await this.send(new EventMessageAudit(options));
	}

	async sendWorkflowEvent(options: EventMessageWorkflowOptions) {
		await this.send(new EventMessageWorkflow(options));
	}

	async sendNodeEvent(options: EventMessageNodeOptions) {
		await this.send(new EventMessageNode(options));
	}
}

export const eventBus = MessageEventBus.getInstance();

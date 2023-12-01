/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */

import { parseString } from 'xml2js';
import type {
	INode,
	JsonObject,
	IDataObject,
	IStatusCodeMessages,
	Severity,
	Functionality,
} from '../Interfaces';
import { NodeError } from './abstract/node.error';
import { removeCircularRefs } from '../utils';

export interface NodeOperationErrorOptions {
	message?: string;
	description?: string;
	runIndex?: number;
	itemIndex?: number;
	severity?: Severity;
	messageMapping?: { [key: string]: string }; // allows to pass custom mapping for error messages scoped to a node
	functionality?: Functionality;
}

interface NodeApiErrorOptions extends NodeOperationErrorOptions {
	message?: string;
	httpCode?: string;
	parseXml?: boolean;
}

/**
 * Top-level properties where an error message can be found in an API response.
 */
const ERROR_MESSAGE_PROPERTIES = [
	'cause',
	'error',
	'message',
	'Message',
	'msg',
	'messages',
	'description',
	'reason',
	'detail',
	'details',
	'errors',
	'errorMessage',
	'errorMessages',
	'ErrorMessage',
	'error_message',
	'_error_message',
	'errorDescription',
	'error_description',
	'error_summary',
	'title',
	'text',
	'field',
	'err',
	'type',
];

/**
 * Top-level properties where an HTTP error code can be found in an API response.
 */
const ERROR_STATUS_PROPERTIES = [
	'statusCode',
	'status',
	'code',
	'status_code',
	'errorCode',
	'error_code',
];

/**
 * Properties where a nested object can be found in an API response.
 */
const ERROR_NESTING_PROPERTIES = ['error', 'err', 'response', 'body', 'data'];

/**
 * Descriptive messages for common HTTP status codes
 * this is used by NodeApiError class
 */
const STATUS_CODE_MESSAGES: IStatusCodeMessages = {
	'4XX': 'Your request is invalid or could not be processed by the service',
	'400': 'Bad request - please check your parameters',
	'401': 'Authorization failed - please check your credentials',
	'402': 'Payment required - perhaps check your payment details?',
	'403': 'Forbidden - perhaps check your credentials?',
	'404': 'The resource you are requesting could not be found',
	'405': 'Method not allowed - please check you are using the right HTTP method',
	'429': 'The service is receiving too many requests from you',

	'5XX': 'The service failed to process your request',
	'500': 'The service was not able to process your request',
	'502': 'Bad gateway - the service failed to handle your request',
	'503':
		'Service unavailable - try again later or consider setting this node to retry automatically (in the node settings)',
	'504': 'Gateway timed out - perhaps try again later?',
};

const UNKNOWN_ERROR_MESSAGE = 'UNKNOWN ERROR - check the detailed error for more information';
const UNKNOWN_ERROR_MESSAGE_CRED = 'UNKNOWN ERROR';

/**
 * Class for instantiating an error in an API response, e.g. a 404 Not Found response,
 * with an HTTP error code, an error message and a description.
 */
export class NodeApiError extends NodeError {
	httpCode: string | null;

	constructor(
		node: INode,
		errorResponse: JsonObject,
		{
			message,
			description,
			httpCode,
			parseXml,
			runIndex,
			itemIndex,
			severity,
			functionality,
			messageMapping,
		}: NodeApiErrorOptions = {},
	) {
		super(node, errorResponse);

		// only for request library error
		if (errorResponse.error) {
			removeCircularRefs(errorResponse.error as JsonObject);
		}

		// if not description provided, try to find it in the error object
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		if (
			!description &&
			(errorResponse.description || (errorResponse?.reason as IDataObject)?.description)
		) {
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			this.description = (errorResponse.description ||
				(errorResponse?.reason as IDataObject)?.description) as string;
		}

		// if not message provided, try to find it in the error object or set description as message
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		if (
			!message &&
			(errorResponse.message || (errorResponse?.reason as IDataObject)?.message || description)
		) {
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			this.message = (errorResponse.message ||
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				(errorResponse?.reason as IDataObject)?.message ||
				description) as string;
		}

		// if it's an error generated by axios
		// look for descriptions in the response object
		if (errorResponse.reason) {
			const reason: IDataObject = errorResponse.reason as unknown as IDataObject;

			if (reason.isAxiosError && reason.response) {
				errorResponse = reason.response as JsonObject;
			}
		}

		// set http code of this error
		if (httpCode) {
			this.httpCode = httpCode;
		} else {
			this.httpCode =
				this.findProperty(errorResponse, ERROR_STATUS_PROPERTIES, ERROR_NESTING_PROPERTIES) ?? null;
		}

		if (severity) {
			this.severity = severity;
		} else if (this.httpCode?.charAt(0) !== '5') {
			this.severity = 'warning';
		}

		// set description of this error
		if (description) {
			this.description = description;
		}

		if (!this.description) {
			if (parseXml) {
				this.setDescriptionFromXml(errorResponse.error as string);
			} else {
				this.description = this.findProperty(
					errorResponse,
					ERROR_MESSAGE_PROPERTIES,
					ERROR_NESTING_PROPERTIES,
				);
			}
		}

		// set message if provided or set default message based on http code
		if (message) {
			this.message = message;
		} else {
			this.setDefaultStatusCodeMessage();
		}

		// if message and description are the same, unset redundant description
		if (this.message === this.description) {
			this.description = undefined;
		}

		// if message contain common error code set descriptive message and update description
		[this.message, this.description] = this.setDescriptiveErrorMessage(
			this.message,
			this.description,
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			this.httpCode ||
				(errorResponse?.code as string) ||
				((errorResponse?.reason as JsonObject)?.code as string) ||
				undefined,
			messageMapping,
		);

		if (functionality !== undefined) this.context.functionality = functionality;
		if (runIndex !== undefined) this.context.runIndex = runIndex;
		if (itemIndex !== undefined) this.context.itemIndex = itemIndex;
	}

	private setDescriptionFromXml(xml: string) {
		parseString(xml, { explicitArray: false }, (_, result) => {
			if (!result) return;

			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			const topLevelKey = Object.keys(result)[0];
			this.description = this.findProperty(
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
				result[topLevelKey],
				ERROR_MESSAGE_PROPERTIES,
				['Error'].concat(ERROR_NESTING_PROPERTIES),
			);
		});
	}

	/**
	 * Set the error's message based on the HTTP status code.
	 */
	private setDefaultStatusCodeMessage() {
		// Set generic error message for 502 Bad Gateway
		if (!this.httpCode && this.message && this.message.toLowerCase().includes('bad gateway')) {
			this.httpCode = '502';
		}

		if (!this.httpCode) {
			this.httpCode = null;
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			this.message = this.message || this.description || UNKNOWN_ERROR_MESSAGE;
			return;
		}

		if (STATUS_CODE_MESSAGES[this.httpCode]) {
			this.description = this.updateDescription(this.message, this.description);
			this.message = STATUS_CODE_MESSAGES[this.httpCode];
			return;
		}

		switch (this.httpCode.charAt(0)) {
			case '4':
				this.description = this.updateDescription(this.message, this.description);
				this.message = STATUS_CODE_MESSAGES['4XX'];
				break;
			case '5':
				this.description = this.updateDescription(this.message, this.description);
				this.message = STATUS_CODE_MESSAGES['5XX'];
				break;
			default:
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				this.message = this.message || this.description || UNKNOWN_ERROR_MESSAGE;
		}
		if (this.node.type === 'n8n-nodes-base.noOp' && this.message === UNKNOWN_ERROR_MESSAGE) {
			this.message = `${UNKNOWN_ERROR_MESSAGE_CRED} - ${this.httpCode}`;
		}
	}
}

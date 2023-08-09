import { Container } from 'typedi';
import type { ExecutionStatus } from 'n8n-workflow';
import { License } from '@/License';
import type { IExecutionFlattedDb, IExecutionResponse } from '@/Interfaces';

const license = Container.get(License);

export function getStatusUsingPreviousExecutionStatusMethod(
	execution: IExecutionFlattedDb | IExecutionResponse,
): ExecutionStatus {
	if (execution.waitTill) {
		return 'waiting';
	} else if (execution.stoppedAt === undefined) {
		return 'running';
	} else if (execution.finished) {
		return 'success';
	} else if (execution.stoppedAt !== null) {
		return 'failed';
	} else {
		return 'unknown';
	}
}

export function isAdvancedExecutionFiltersEnabled(): boolean {
	return license.isAdvancedExecutionFiltersEnabled();
}

export function isDebugInEditorLicensed(): boolean {
	return license.isDebugInEditorLicensed();
}

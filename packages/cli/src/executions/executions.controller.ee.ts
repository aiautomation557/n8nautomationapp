import express from 'express';
import type {
	IExecutionFlattedResponse,
	IExecutionResponse,
	IExecutionsListResponse,
} from '@/Interfaces';
import type { ExecutionRequest, ListQuery } from '@/requests';
import * as ResponseHelper from '@/ResponseHelper';
import { isSharingEnabled } from '@/UserManagement/UserManagementHelper';
import { EEExecutionsService } from './executions.service.ee';
import { filterListQueryMiddleware } from '@/middlewares/listQuery/filter';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const EEExecutionsController = express.Router();

EEExecutionsController.use((req, res, next) => {
	if (!isSharingEnabled()) {
		// skip ee router and use free one
		next('router');
		return;
	}
	// use ee router
	next();
});

/**
 * GET /executions
 */
EEExecutionsController.get(
	'/',
	filterListQueryMiddleware,
	ResponseHelper.send(async (req: ListQuery.Request): Promise<IExecutionsListResponse> => {
		console.log(req.listQueryOptions);
		return EEExecutionsService.getExecutionsList(req);
	}),
);

/**
 * GET /executions/:id
 */
EEExecutionsController.get(
	'/:id(\\d+)',
	ResponseHelper.send(
		async (
			req: ExecutionRequest.Get,
		): Promise<IExecutionResponse | IExecutionFlattedResponse | undefined> => {
			return EEExecutionsService.getExecution(req);
		},
	),
);

/**
 * POST /executions/:id/retry
 */
EEExecutionsController.post(
	'/:id/retry',
	ResponseHelper.send(async (req: ExecutionRequest.Retry): Promise<boolean> => {
		return EEExecutionsService.retryExecution(req);
	}),
);

/**
 * POST /executions/delete
 * INFORMATION: We use POST instead of DELETE to not run into any issues with the query data
 * getting too long
 */
EEExecutionsController.post(
	'/delete',
	ResponseHelper.send(async (req: ExecutionRequest.Delete): Promise<void> => {
		await EEExecutionsService.deleteExecutions(req);
	}),
);

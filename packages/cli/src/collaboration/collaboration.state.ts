import type { User } from '@db/entities/User';
import { assert, type Workflow } from 'n8n-workflow';
import { Service } from 'typedi';

type ActiveWorkflowUser = {
	userId: User['id'];
	lastSeen: Date;
};

type UserStateByUserId = Map<User['id'], ActiveWorkflowUser>;

type State = {
	activeUsersByWorkflowId: Map<Workflow['id'], UserStateByUserId>;
};

/**
 * State management for the collaboration service
 */
@Service()
export class CollaborationState {
	private state: State = {
		activeUsersByWorkflowId: new Map(),
	};

	addActiveWorkflowUser(workflowId: Workflow['id'], userId: User['id']) {
		const { activeUsersByWorkflowId } = this.state;

		let activeUsers = activeUsersByWorkflowId.get(workflowId);
		if (!activeUsers) {
			activeUsers = new Map();
			activeUsersByWorkflowId.set(workflowId, activeUsers);
		}

		activeUsers.set(userId, {
			userId,
			lastSeen: new Date(),
		});
	}

	removeActiveWorkflowUser(workflowId: Workflow['id'], userId: User['id']) {
		const { activeUsersByWorkflowId } = this.state;

		const activeUsers = activeUsersByWorkflowId.get(workflowId);
		if (!activeUsers) {
			return;
		}

		activeUsers.delete(userId);
		if (activeUsers.size === 0) {
			activeUsersByWorkflowId.delete(workflowId);
		}
	}

	getActiveWorkflowUsers(workflowId: Workflow['id']): ActiveWorkflowUser[] {
		const workflowState = this.state.activeUsersByWorkflowId.get(workflowId);
		if (!workflowState) {
			return [];
		}

		return [...workflowState.values()];
	}

	/**
	 * Removes all users that have not been seen for a given time
	 */
	cleanInactiveUsers(inactiveTimeInMs: number): Array<Workflow['id']> {
		const { activeUsersByWorkflowId } = this.state;
		const now = Date.now();
		const updatedWorkflowIds = new Set<Workflow['id']>();

		for (const workflowId of activeUsersByWorkflowId.keys()) {
			const activeUsers = activeUsersByWorkflowId.get(workflowId);
			assert(activeUsers);

			for (const user of activeUsers.values()) {
				if (now - user.lastSeen.getTime() > inactiveTimeInMs) {
					activeUsers.delete(user.userId);
					updatedWorkflowIds.add(workflowId);
				}
			}

			if (activeUsers.size === 0) {
				activeUsersByWorkflowId.delete(workflowId);
			}
		}

		return Array.from(updatedWorkflowIds);
	}
}

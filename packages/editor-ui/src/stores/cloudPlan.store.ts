import { computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import type { CloudPlanState } from '@/Interface';
import { useRootStore } from '@/stores/n8nRoot.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useUsersStore } from '@/stores/users.store';
import { getCurrentPlan } from '@/api/cloudPlans';
import { useCloudPlanHelper } from '@/composables/useCloudPlanHelper';

const DEFAULT_STATE: CloudPlanState = {
	data: {
		planId: 0,
		monthlyExecutionsLimit: 0,
		activeWorkflowsLimit: 0,
		credentialsLimit: 0,
		isActive: false,
		displayName: '',
		expirationDate: '',
		metadata: {
			version: 'v1',
			group: 'opt-in',
			slug: 'trial-1',
		},
		usage: {
			executions: 0,
			activeWorkflows: 0,
		},
	},
};

export const useCloudPlanStore = defineStore('cloudPlan', () => {
	const rootStore = useRootStore();
	const settingsStore = useSettingsStore();
	const usersStore = useUsersStore();
	const { userIsTrialing: _userIsTrialing } = useCloudPlanHelper();

	const state = reactive<CloudPlanState>(DEFAULT_STATE);

	const setData = (data: CloudPlanState['data']) => {
		state.data = data;
	};

	const userIsTrialing = computed(() => _userIsTrialing(state.data?.metadata));

	const currentPlanData = computed(() => state.data);

	const getOwnerCurrentPLan = async () => {
		// TODO: uncomment before releasing
		// const cloudUserId = settingsStore.settings.n8nMetadata?.userId;
		const cloudUserId = '123';
		const hasCloudPlan =
			usersStore.currentUser?.isOwner && settingsStore.isCloudDeployment && cloudUserId;
		if (!hasCloudPlan) throw new Error('User does not have a cloud plan');
		return getCurrentPlan(rootStore.getRestCloudApiContext, cloudUserId as string);
	};

	return {
		setData,
		getOwnerCurrentPLan,
		userIsTrialing,
		currentPlanData,
	};
});

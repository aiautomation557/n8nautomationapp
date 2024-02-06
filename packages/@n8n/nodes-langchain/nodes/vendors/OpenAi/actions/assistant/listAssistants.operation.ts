import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';
import { apiRequest } from '../../transport';

const properties: INodeProperties[] = [
	{
		displayName: 'Simplify Output',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},
];

const displayOptions = {
	show: {
		operation: ['listAssistants'],
		resource: ['assistant'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	let has_more = true;
	let after: string | undefined;

	do {
		const response = await apiRequest.call(this, 'GET', '/assistants', {
			headers: {
				'OpenAI-Beta': 'assistants=v1',
			},
			qs: {
				limit: 100,
				after,
			},
		});

		for (const assistant of response.data || []) {
			returnData.push({ json: assistant });
		}

		has_more = response.has_more;

		if (has_more) {
			after = response.last_id as string;
		} else {
			break;
		}
	} while (has_more);

	const simplify = this.getNodeParameter('simplify', i) as boolean;

	if (simplify) {
		return returnData.map((item) => {
			const { id, name, model } = item.json;
			return {
				json: {
					id,
					name,
					model,
				},
			};
		});
	}

	return returnData;
}

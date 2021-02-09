import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import {
	peekalinkApiRequest,
} from './GenericFunctions';

export class Peekalink implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Peekalink',
		name: 'peekalink',
		icon: 'file:peekalink.png',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"]',
		description: 'Consume the Peekalink API',
		defaults: {
			name: 'Peekalink',
			color: '#00ade8',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'peekalinkApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Is available',
						value: 'isAvailable',
						description: 'Check whether preview for a given link is available',
					},
					{
						name: 'Preview',
						value: 'preview',
						description: 'Return the preview for a link',
					},
				],
				default: 'preview',
				description: 'The operation to perform.',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				description: '',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const length = items.length as unknown as number;
		const qs: IDataObject = {};
		let responseData;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < length; i++) {
			if (operation === 'isAvailable') {
				const url = this.getNodeParameter('url', i) as string;
				const body: IDataObject = {
					link: url,
				};

				responseData = await peekalinkApiRequest.call(this, 'POST', `/is-available/`, body);
			}
			if (operation === 'preview') {
				const url = this.getNodeParameter('url', i) as string;
				const body: IDataObject = {
					link: url,
				};

				responseData = await peekalinkApiRequest.call(this, 'POST', `/`, body);
			}
			if (Array.isArray(responseData)) {
				returnData.push.apply(returnData, responseData as IDataObject[]);
			} else {
				returnData.push(responseData as IDataObject);
			}
		}
		return [this.helpers.returnJsonArray(returnData)];
	}
}

import {
	INodeProperties,
} from 'n8n-workflow';

export const contactListOperations = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [
					'contactList',
				],
			},
		},
		options: [
			{
				name: 'Add',
				value: 'add',
				description: 'Add contact to list',
			},
			{
				name: 'Exist',
				value: 'exist',
				description: 'Check if contact is on list',
			},
			{
				name: 'Remove',
				value: 'remove',
				description: 'Remove a contact from a list',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all contacts on list',
			},
		],
		default: 'add',
		description: 'The operation to perform.',
	},
] as INodeProperties[];

export const contactListFields = [

	/* -------------------------------------------------------------------------- */
	/*                                 contactList:add                            */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'List ID',
		name: 'listId',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getLists',
		},
		type: 'options',
		displayOptions: {
			show: {
				operation: [
					'add',
					'remove',
					'exist',
					'getAll',
				],
				resource: [
					'contactList',
				],
			},
		},
		default: '',
		description: 'The list ID.',
	},
	{
		displayName: 'Contact ID',
		name: 'contactId',
		required: true,
		type: 'string',
		displayOptions: {
			show: {
				operation: [
					'add',
					'remove',
					'exist',
				],
				resource: [
					'contactList',
				],
			},
		},
		default: '',
		description: 'Can be the Contact ID or email.',
	},
	/* -------------------------------------------------------------------------- */
	/*                                 contactList:getAll                         */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: [
					'getAll',
				],
				resource: [
					'contactList',
				],
			},
		},
		default: false,
		description: 'If all results should be returned or only up to a given limit.',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				operation: [
					'getAll',
				],
				resource: [
					'contactList',
				],
				returnAll: [
					false,
				],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 500,
		},
		default: 100,
		description: 'How many results to return.',
	},
] as INodeProperties[];

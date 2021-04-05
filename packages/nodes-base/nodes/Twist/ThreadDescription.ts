import {
	INodeProperties,
} from 'n8n-workflow';

export const threadOperations = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [
					'thread',
				],
			},
		},
		options: [
			{
				name: 'Add',
				value: 'add',
				description: 'Adds a new thread to a channel.',
			},
			{
				name: 'Remove',
				value: 'remove',
				description: 'Remove a thread',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get information about a thread',
			},
			{
				name: 'Get All',
				value: 'getAll',
				description: 'Get all threads',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a thread',
			},
		],
		default: 'add',
		description: 'The operation to perform.',
	},
] as INodeProperties[];

export const threadFields = [
	/*-------------------------------------------------------------------------- */
	/*                                thread:add                                 */
	/* ------------------------------------------------------------------------- */
    {
		displayName: 'Workspace ID',
		name: 'workspaceId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getWorkspaces',
		},
		default: '',
		displayOptions: {
			show: {
				operation: [
					'add',
				],
				resource: [
					'thread',
				],
			},
		},
		required: true,
		description: 'The id of the workspace.',
	},
	{
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: [
					'add',
				],
				resource: [
					'thread',
				],
			},
		},
		required: true,
		description: 'The id of the channel.',
	},
    {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        default: '',
        displayOptions: {
			show: {
				operation: [
					'add',
				],
				resource: [
					'thread',
				],
			},
		},
        required: true,
        description: 'The title of the new thread (1 < length < 300).',
    },
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: [
					'add',
				],
				resource: [
					'thread',
				],
			},
		},
		required: true,
		description: 'The content of the thread.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: [
					'thread',
				],
				operation: [
					'add',
				],
			},
		},
		options: [
            {
				displayName: 'Actions',
				name: 'actionsUi',
				type: 'fixedCollection',
				placeholder: 'Add Action',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Action',
						name: 'actionValues',
						values: [
							{
								displayName: 'Action',
								name: 'action',
								type: 'options',
								description: 'The action of the button',
								options: [
									{
										name: 'Open URL',
										value: 'open_url',
									},
									{
										name: 'Prefill Message',
										value: 'prefill_message',
									},
									{
										name: 'Send Reply',
										value: 'send_reply',
									},
								],
								default: '',
							},
							{
								displayName: 'Button Text',
								name: 'button_text',
								type: 'string',
								description: 'The text for the action button.',
								default: '',
							},
							{
								displayName: 'Message',
								name: 'message',
								type: 'string',
								displayOptions: {
									show: {
										action: [
											'send_reply',
											'prefill_message',
										],
									},
								},
								description: 'The text for the action button.',
								default: '',
							},
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								description: 'The type of the button, for now just action is available.',
								options: [
									{
										name: 'Action',
										value: 'action',
									},
								],
								default: '',
							},
							{
								displayName: 'URL',
								name: 'url',
								type: 'string',
								displayOptions: {
									show: {
										action: [
											'open_url',
										],
									},
								},
								description: 'URL to redirect',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Attachments',
				name: 'binaryProperties',
				type: 'string',
				default: 'data',
				description: 'Name of the property that holds the binary data. Multiple can be defined separated by comma.',
			},
			{
				displayName: 'Direct Mentions',
				name: 'direct_mentions',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getUsers',
                    loadOptionsDependsOn: [
						'workspaceId',
					],
				},
				default: [],
				description: `The users that are directly mentioned`,
			},
			{
				displayName: 'Recipients',
				name: 'recipients',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getUsers',
					loadOptionsDependsOn: [
						'workspaceId',
					],
				},
				default: [],
				description: 'The users that will attached to the thread.',
			},
            {
				displayName: 'Send as integration',
				name: 'send_as_integration',
				type: 'boolean',
				default: false,
				description: 'Displays the integration as the thread creator.',
			},
            {
				displayName: 'Temporary ID',
				name: 'temp_id',
				type: 'number',
				default: 0,
				description: 'The temporary id of the thread.',
			},
		],
	},
	/* -------------------------------------------------------------------------- */
	/*                                  thread:get/remove                         */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Thread ID',
		name: 'threadId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: [
					'get',
					'remove',
				],
				resource: [
					'thread',
				],
			},
		},
		required: true,
		description: 'The ID of the thread',
	},
	/* -------------------------------------------------------------------------- */
	/*                                 thread:getAll                             */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Workspace ID',
		name: 'workspaceId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getWorkspaces',
		},
		default: '',
		displayOptions: {
			show: {
				operation: [
					'getAll',
				],
				resource: [
					'thread',
				],
			},
		},
		required: true,
		description: 'The ID of the workspace.',
	},
    {
		displayName: 'Channel ID',
		name: 'channelId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: [
					'getAll',
				],
				resource: [
					'thread',
				],
			},
		},
		required: true,
		description: 'The ID of the channel.',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: [
					'thread',
				],
				operation: [
					'getAll',
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
				resource: [
					'thread',
				],
				operation: [
					'getAll',
				],
				returnAll: [
					false,
				],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		description: 'How many results to return.',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: [
					'thread',
				],
				operation: [
					'getAll',
				],
			},
		},
		options: [
			{
				displayName: 'As IDs',
				name: 'as_ids',
				type: 'boolean',
				default: false,
				description: 'If enabled, only the ids of the threads are returned.',
			},
            {
				displayName: 'Filter By',
				name: 'filter_by',
				type: 'options',
                options: [
					{
						name: 'Attached to me',
						value: 'attached_to_me',
					},
                    {
						name: 'Everyone',
						value: 'everyone',
					},
                    {
						name: 'Starred',
						value: 'is_starred',
					},
				],
				default: '',
				description: 'A filter can be one of attached_to_me, everyone and is_starred.',
			},
            {
				displayName: 'Newer Than',
				name: 'newer_than_ts',
				type: 'dateTime',
				default: '',
				description: 'Limits threads to those newer when the specified Unix time.',
			},
            {
				displayName: 'Older Than',
				name: 'older_than_ts',
				type: 'dateTime',
				default: '',
				description: 'Limits threads to those older than the specified Unix time.',
			},
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                                  thread:update                            */
	/* -------------------------------------------------------------------------- */
    {
		displayName: 'Workspace ID',
		name: 'workspaceId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getWorkspaces',
		},
		default: '',
		displayOptions: {
			show: {
				operation: [
					'update',
				],
				resource: [
					'thread',
				],
			},
		},
		required: true,
		description: 'The ID of the workspace.',
	},
    {
		displayName: 'Thread ID',
		name: 'threadId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: [
					'update',
				],
				resource: [
					'thread',
				],
			},
		},
		required: true,
		description: 'The ID of the thread',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: [
					'thread',
				],
				operation: [
					'update',
				],
			},
		},
		options: [
            {
                displayName: 'Title',
                name: 'title',
                type: 'string',
                default: '',
                description: 'The title of the thread (1 < length < 300).',
            },
            {
                displayName: 'Content',
                name: 'content',
                type: 'string',
                default: '',
                description: 'The content of the thread.',
            },
            {
				displayName: 'Actions',
				name: 'actionsUi',
				type: 'fixedCollection',
				placeholder: 'Add Action',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Action',
						name: 'actionValues',
						values: [
							{
								displayName: 'Action',
								name: 'action',
								type: 'options',
								description: 'The action of the button',
								options: [
									{
										name: 'Open URL',
										value: 'open_url',
									},
									{
										name: 'Prefill Message',
										value: 'prefill_message',
									},
									{
										name: 'Send Reply',
										value: 'send_reply',
									},
								],
								default: '',
							},
							{
								displayName: 'Button Text',
								name: 'button_text',
								type: 'string',
								description: 'The text for the action button.',
								default: '',
							},
							{
								displayName: 'Message',
								name: 'message',
								type: 'string',
								displayOptions: {
									show: {
										action: [
											'send_reply',
											'prefill_message',
										],
									},
								},
								description: 'The text for the action button.',
								default: '',
							},
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								description: 'The type of the button, for now just action is available.',
								options: [
									{
										name: 'Action',
										value: 'action',
									},
								],
								default: '',
							},
							{
								displayName: 'URL',
								name: 'url',
								type: 'string',
								displayOptions: {
									show: {
										action: [
											'open_url',
										],
									},
								},
								description: 'URL to redirect',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Attachments',
				name: 'binaryProperties',
				type: 'string',
				default: 'data',
				description: 'Name of the property that holds the binary data. Multiple can be defined separated by comma.',
			},
			{
				displayName: 'Direct Mentions',
				name: 'direct_mentions',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getUsers',
                    loadOptionsDependsOn: [
						'workspaceId',
					],
				},
				default: [],
				description: `The users that are directly mentioned`,
			},
		],
	},
] as INodeProperties[];

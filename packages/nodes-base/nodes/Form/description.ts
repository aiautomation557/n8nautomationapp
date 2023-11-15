import {
	FORM_TRIGGER_PATH_IDENTIFIER,
	type INodeProperties,
	type INodeTypeDescription,
} from 'n8n-workflow';

const webhookPath: INodeProperties = {
	displayName: 'Path',
	name: 'path',
	type: 'string',
	default: '',
	placeholder: 'webhook',
	required: true,
	description: 'The path to listen to',
};

export const formTitle: INodeProperties = {
	displayName: 'Form Title',
	name: 'formTitle',
	type: 'string',
	default: '',
	placeholder: 'e.g. Contact us',
	required: true,
	description: 'Shown at the top of the form',
};

export const formDescription: INodeProperties = {
	displayName: 'Form Description',
	name: 'formDescription',
	type: 'string',
	default: '',
	placeholder: "e.g. We'll get back to you soon",
	description:
		'Shown underneath the Form Title. Can be used to prompt the user on how to complete the form.',
};

export const formFields: INodeProperties = {
	displayName: 'Form Fields',
	name: 'formFields',
	placeholder: 'Add Form Field',
	type: 'fixedCollection',
	default: { values: [{ label: '', fieldType: 'text' }] },
	typeOptions: {
		multipleValues: true,
		sortable: true,
	},
	options: [
		{
			displayName: 'Values',
			name: 'values',
			values: [
				{
					displayName: 'Field Label',
					name: 'fieldLabel',
					type: 'string',
					default: '',
					placeholder: 'e.g. What is your name?',
					description: 'Label appears above the input field',
					required: true,
				},
				{
					displayName: 'Field Type',
					name: 'fieldType',
					type: 'options',
					default: 'text',
					description: 'The type of field to add to the form',
					options: [
						{
							name: 'Date',
							value: 'date',
						},
						{
							name: 'Dropdown List',
							value: 'dropdown',
						},
						{
							name: 'Number',
							value: 'number',
						},
						{
							name: 'Password',
							value: 'password',
						},
						{
							name: 'Text',
							value: 'text',
						},
						{
							name: 'Textarea',
							value: 'textarea',
						},
					],
					required: true,
				},
				{
					displayName: 'Field Options',
					name: 'fieldOptions',
					placeholder: 'Add Field Option',
					description: 'List of options that can be selected from the dropdown',
					type: 'fixedCollection',
					default: { values: [{ option: '' }] },
					required: true,
					displayOptions: {
						show: {
							fieldType: ['dropdown'],
						},
					},
					typeOptions: {
						multipleValues: true,
						sortable: true,
					},
					options: [
						{
							displayName: 'Values',
							name: 'values',
							values: [
								{
									displayName: 'Option',
									name: 'option',
									type: 'string',
									default: '',
								},
							],
						},
					],
				},
				{
					displayName: 'Multiple Choice',
					name: 'multiselect',
					type: 'boolean',
					default: false,
					description:
						'Whether to allow the user to select multiple options from the dropdown list',
					displayOptions: {
						show: {
							fieldType: ['dropdown'],
						},
					},
				},
				{
					displayName: 'Required Field',
					name: 'requiredField',
					type: 'boolean',
					default: false,
					description:
						'Whether to require the user to enter a value for this field before submitting the form',
				},
			],
		},
	],
};

export const formRespondMode: INodeProperties = {
	displayName: 'Respond When',
	name: 'responseMode',
	type: 'options',
	options: [
		{
			name: 'Form Is Submitted',
			value: 'onReceived',
			description: 'As soon as this node receives the form submission',
		},
		{
			name: 'Workflow Finishes',
			value: 'lastNode',
			description: 'When the last node of the workflow is executed',
		},
		{
			name: "Using 'Respond to Webhook' Node",
			value: 'responseNode',
			description: 'Response defined in that node',
		},
	],
	default: 'onReceived',
	description: 'When to respond to the form submission',
};

export const formOptions: INodeProperties = {
	displayName: 'Options',
	name: 'options',
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: {
		hide: {
			responseMode: ['responseNode'],
		},
	},
	options: [
		{
			displayName: 'Respond With',
			name: 'respondWith',
			type: 'options',
			default: 'text',
			options: [
				{
					name: 'Form Submitted Text',
					value: 'text',
					description: 'Show a text to the user after form submission',
				},
				{
					name: 'Redirect URL',
					value: 'redirect',
					description: 'Redirect the user to a URL after form submission',
				},
			],
		},
		{
			displayName: 'Form Submitted Text',
			name: 'formSubmittedText',
			description: 'The text displayed to users after they filled the form',
			type: 'string',
			default: 'Your response has been recorded',
			displayOptions: {
				hide: {
					respondWith: ['redirect'],
				},
			},
		},
		{
			displayName: 'Redirect URL',
			name: 'redirectUrl',
			description: 'The URL to redirect to after the user submits the form',
			type: 'string',
			default: '',
			validateType: 'url',
			displayOptions: {
				show: {
					respondWith: ['redirect'],
				},
			},
		},
	],
};

const formTriggerPanel = {
	header: 'Pull in a test form submission',
	executionsHelp: {
		inactive:
			"Form Trigger has two modes: test and production. <br /> <br /> <b>Use test mode while you build your workflow</b>. Click the 'Test Step' button, then fill out the test form that opens in a popup tab. The executions will show up in the editor.<br /> <br /> <b>Use production mode to run your workflow automatically</b>. <a data-key=\"activate\">Activate</a> the workflow, then make requests to the production URL. Then every time there's a form submission via the Production Form URL, the workflow will execute. These executions will show up in the executions list, but not in the editor.",
		active:
			"Form Trigger has two modes: test and production. <br /> <br /> <b>Use test mode while you build your workflow</b>. Click the 'Test Step' button, then fill out the test form that opens in a popup tab. The executions will show up in the editor.<br /> <br /> <b>Use production mode to run your workflow automatically</b>. <a data-key=\"activate\">Activate</a> the workflow, then make requests to the production URL. Then every time there's a form submission via the Production Form URL, the workflow will execute. These executions will show up in the executions list, but not in the editor.",
	},
	activationHint: {
		active:
			"This node will also trigger automatically on new form submissions (but those executions won't show up here).",
		inactive:
			'<a data-key="activate">Activate</a> this workflow to have it also run automatically for new form submissions created via the Production URL.',
	},
};

export const formTriggerDescription: INodeTypeDescription = {
	displayName: 'n8n Form Trigger',
	name: 'formTrigger',
	icon: 'file:form.svg',
	group: ['trigger'],
	version: 1,
	description: 'Runs the flow when an n8n generated webform is submitted',
	defaults: {
		name: 'n8n Form Trigger',
	},
	inputs: [],
	outputs: ['main'],
	webhooks: [
		{
			name: 'setup',
			httpMethod: 'GET',
			responseMode: 'onReceived',
			isFullPath: true,
			path: `={{$parameter["path"]}}/${FORM_TRIGGER_PATH_IDENTIFIER}`,
			ndvHideUrl: true,
		},
		{
			name: 'default',
			httpMethod: 'POST',
			responseMode: '={{$parameter["responseMode"]}}',
			responseData: '={{$parameter["responseMode"] === "lastNode" ? "noData" : undefined}}',
			isFullPath: true,
			path: `={{$parameter["path"]}}/${FORM_TRIGGER_PATH_IDENTIFIER}`,
			ndvHideMethod: true,
		},
	],
	eventTriggerDescription: 'Waiting for you to submit the form',
	activationMessage: 'You can now make calls to your production Form URL.',
	triggerPanel: formTriggerPanel,
	properties: [webhookPath, formTitle, formDescription, formFields, formRespondMode, formOptions],
};

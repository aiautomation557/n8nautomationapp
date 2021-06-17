import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';


export class S3 implements ICredentialType {
	name = 's3';
	displayName = 'S3';
	documentationUrl = 's3';
	properties: INodeProperties[] = [
		{
			displayName: 'S3 endpoint',
			name: 'endpoint',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Region',
			name: 'region',
			type: 'string',
			default: 'us-east-1',
		},
		{
			displayName: 'Access Key Id',
			name: 'accessKeyId',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Secret Access Key',
			name: 'secretAccessKey',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
		},
		{
			displayName: 'Force path style',
			name: 'forcePathStyle',
			type: 'boolean',
			default: false,
		},
	];
}

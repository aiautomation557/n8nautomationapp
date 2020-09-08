import {
	ICredentialType,
	NodePropertyTypes,
} from 'n8n-workflow';

export class TaigaServerApi implements ICredentialType {
	name = 'taigaServerApi';
	displayName = 'Taiga Server API';
	properties = [
		{
			displayName: 'Username',
			name: 'username',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string' as NodePropertyTypes,
			default: '',
			placeholder: 'taiga.yourdomain.com',
		},
	];
}

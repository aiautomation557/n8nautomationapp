export type GristCredentials = {
	apiKey: string;
	planType: 'free' | 'paid';
	customSubdomain?: string;
}

export type GristColumns = {
	columns: Array<{ id: string }>;
};

export type GristSortProperties = Array<{
	field: string;
	direction: 'asc' | 'desc';
}>;

export type GristFilterProperties = Array<{
	field: string;
	values: string;
}>;

export type GristGetAllOptions = {
	sort?: { sortProperties: GristSortProperties };
	filter?: { filterProperties: GristFilterProperties };
};

export type GristDefinedData = Array<{
	fieldId: string;
	fieldValue: string;
}>;

export type GristCreateRowPayload = {
	records: Array<{
		fields: { [key: string]: any };
	}>
};

export type GristUpdateRowPayload = GristCreateRowPayload;

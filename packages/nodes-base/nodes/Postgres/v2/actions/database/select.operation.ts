import type { IExecuteFunctions } from 'n8n-core';
import type { IDataObject, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../../../../utils/utilities';

import type {
	PgpClient,
	PgpDatabase,
	QueryValues,
	QueryWithValues,
	SortRule,
	WhereClause,
} from '../../helpers/interfaces';

import {
	addSortRules,
	addWhereClauses,
	replaceEmptyStringsByNulls,
	runQueries,
} from '../../helpers/utils';

import {
	optionsCollection,
	sortFixedCollection,
	whereFixedCollection,
} from '../common.descriptions';

const properties: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				returnAll: [false],
			},
		},
	},
	whereFixedCollection,
	sortFixedCollection,
	optionsCollection,
];

const displayOptions = {
	show: {
		resource: ['database'],
		operation: ['select'],
	},
	hide: {
		table: [''],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	pgp: PgpClient,
	db: PgpDatabase,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const options = this.getNodeParameter('options', 0);

	items = replaceEmptyStringsByNulls(items, options.replaceEmptyStrings as boolean);

	const queries: QueryWithValues[] = [];

	for (let i = 0; i < items.length; i++) {
		const schema = this.getNodeParameter('schema', i, undefined, {
			extractValue: true,
		}) as string;

		const table = this.getNodeParameter('table', i, undefined, {
			extractValue: true,
		}) as string;

		let values: QueryValues = [schema, table];

		const outputColumns = this.getNodeParameter('options.outputColumns', i, ['*']) as string[];

		let query = '';

		if (outputColumns.includes('*')) {
			query = 'SELECT * FROM $1:name.$2:name';
		} else {
			values.push(outputColumns);
			query = `SELECT $${values.length}:name FROM $1:name.$2:name`;
		}

		const whereClauses =
			((this.getNodeParameter('where', i, []) as IDataObject).values as WhereClause[]) || [];

		const combineConditions = this.getNodeParameter(
			'options.combineConditions',
			i,
			'AND',
		) as string;

		[query, values] = addWhereClauses(query, whereClauses, values, combineConditions);

		const sortRules =
			((this.getNodeParameter('sort', i, []) as IDataObject).values as SortRule[]) || [];

		[query, values] = addSortRules(query, sortRules, values);

		const returnAll = this.getNodeParameter('returnAll', i, false);
		if (!returnAll) {
			const limit = this.getNodeParameter('limit', i, 50);
			query += ` LIMIT ${limit}`;
		}

		const queryWithValues = { query, values };
		queries.push(queryWithValues);
	}

	return runQueries.call(this, pgp, db, queries, items, options);
}

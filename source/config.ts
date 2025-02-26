import { resolve } from 'node:path';
import { readFile } from 'node:fs';
import { validate, Schema } from 'jsonschema';


export function readConfig(config?: string): Promise<[ConfigOptions, string | undefined]> {
	const filename = resolve(config ?? 'sprintest.json');

	return new Promise((resolve, reject) => {
		readFile(filename, (error, buffer) => {
			if (error == null) {
				resolve([validateConfig(JSON.parse(buffer.toString()), schema), filename]);
			} else if (error.code === 'ENOENT' && config == null) {
				resolve([{ directories: [], matches: [] }, undefined]);
			} else {
				reject(error);
			}
		});
	});
}

export function validateConfig(config: any, schema: Schema): ConfigOptions {
	return validate(config, schema, { throwAll: true }).instance;
}

export interface ConfigOptions {
	directories: string[];
	matches: string[];
}

export const schema: Schema = {
	type: 'object',
	properties: {
		'directories': {
			type: 'array',
			items: { type: 'string' },
			default: ['.'],
		},
		'matches': {
			type: 'array',
			items: { type: 'string' },
			default: [
				'*.test.js',
				'*.test.ts',
			],
		},
	},
};
import { resolve } from 'node:path';
import { readFile } from 'node:fs';
import { validate, type Schema } from 'jsonschema';


/**
 * Reads the contents of a config file at the given path.
 * @param filename - Optional path to a config file, 'sprintest.json' used if omited.
 * @returns The config options stored in the file, and its filename if it was found.
 */
export function readConfig(filename?: string): Promise<[ConfigOptions, string | undefined]> {
	const path = resolve(filename ?? 'sprintest.json');

	return new Promise((resolve, reject) => {
		readFile(path, (error, buffer) => {
			if (error == null) {
				const config = JSON.parse(buffer.toString());
				const result = validate(config, schema);

				if (result.valid) {
					config.directories ??= defaultConfig.directories;
					config.matches ??= defaultConfig.matches;
					resolve([config, filename]);
				} else {
					reject(result.errors);
				}
			} else if (error.code === 'ENOENT' && filename == null) {
				resolve([defaultConfig, undefined]);
			} else {
				reject(error);
			}
		});
	});
}

export interface ConfigOptions {
	directories: string[];
	matches: string[];
}

export const defaultConfig: ConfigOptions = {
	directories: ["src", "source", "test", "tests"],
	matches: ["**/*.test.js", "**/*.test.ts"],
};

export const schema: Schema = {
	type: 'object',
	properties: {
		'directories': {
			type: 'array',
			items: { type: 'string' },
			default: defaultConfig.directories,
		},
		'matches': {
			type: 'array',
			items: { type: 'string' },
			default: defaultConfig.matches,
		},
	},
};
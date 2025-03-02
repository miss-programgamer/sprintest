import { resolve } from 'node:path';
import { readFile } from 'node:fs';
import { validate, type Schema } from 'jsonschema';


/**
 * Reads the contents of a config file at the given path.
 * @param filename - Optional path to a config file, 'sprintest.json' used if omited.
 * @returns A config options object, its filename, and an object specifying which properties were provided/defaulted.
 */
export function readConfig(filename?: string): Promise<[ConfigOptions, string, ConfigSpec]> {
	const path = resolve(filename ?? 'sprintest.json');

	return new Promise((resolve, reject) => {
		readFile(path, (error, buffer) => {
			if (error == null) {
				const config = JSON.parse(buffer.toString());
				const result = validate(config, schema);

				if (result.valid) {
					const directoriesProvided = config.directories != null;
					const matchesProvided = config.matches != null;
					config.directories ??= defaultConfig.directories;
					config.matches ??= defaultConfig.matches;
					resolve([config, path, {
						filenameFound: true,
						filenameProvided: filename != null,
						directoriesProvided,
						matchesProvided,
					}]);
				} else {
					reject(result.errors);
				}
			} else if (error.code === 'ENOENT' && filename == null) {
				resolve([defaultConfig, path, {
					filenameFound: false,
					filenameProvided: false,
					directoriesProvided: false,
					matchesProvided: false,
				}]);
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

export interface ConfigSpec {
	filenameFound: boolean;
	filenameProvided: boolean;
	directoriesProvided: boolean;
	matchesProvided: boolean;
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
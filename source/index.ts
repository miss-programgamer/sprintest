#!/usr/bin/env node
import { sep, resolve, dirname } from 'node:path';
import { join, relative } from 'node:path/posix';
import { cwd } from 'node:process';
import { readdir } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';

import { ArgumentParser } from 'argparse';
import { isMatch } from 'picomatch';
import { build } from 'esbuild';

import { readConfig } from './config';
import { indent } from './utilities';
import runtime from './runtime';


async function main(args: Args) {
	const toPosixPath = (sep === '\\') ? toPosixPathFn : (str: string) => str;

	const [config, configFilename] = await readConfig(args.config);

	if (args.verbose && configFilename != null) {
		console.log(configFilename);
		console.log(indent(JSON.stringify(config, null, '  '), '>>> '));
		console.log('');
	}

	const configDir = dirname(configFilename ?? cwd());
	const configDirPosix = toPosixPath(configDir);

	const files = new Set<string>();

	for (const directory of new Set(config.directories)) {
		for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
			if (entry.isFile()) {
				const filename = toPosixPath(resolve(entry.parentPath, entry.name));
				if (isMatch(relative(configDirPosix, filename), config.matches)) {
					files.add(filename);

					if (args.verbose) {
						console.log(`[match]: ${relative(configDirPosix, filename)}`);
					}
				}
			}
		}
	}

	const result = await build({
		entryPoints: [...files],
		platform: 'node',
		bundle: true,
		write: false,
		outdir: 'out',
	});

	const context = createContext(runtime);

	for (const file of result.outputFiles) {
		runInContext(file.text, context, { filename: file.path });
	}
}

function toPosixPathFn(filename: string): string {
	return join(...filename.split(sep));
}


interface Args {
	config?: string;
	tests: string[];
	verbose: boolean;
}

const parser = new ArgumentParser({
	description: 'Run your tests, no more no less.',
});

parser.add_argument('tests', { nargs: '*' });
parser.add_argument('-c', '--config', { required: false });
parser.add_argument('-v', '--verbose', { action: 'store_const', const: true, default: false });

main(parser.parse_args() as Args);
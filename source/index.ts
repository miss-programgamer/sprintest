#!/usr/bin/env node
import { sep, resolve, dirname } from 'node:path';
import { join, relative } from 'node:path/posix';
import { createContext, runInContext } from 'node:vm';
import { readdir } from 'node:fs/promises';
import { cwd } from 'node:process';

import { ArgumentParser } from 'argparse';
import { isMatch } from 'picomatch';
import { build } from 'esbuild';

import { readConfig } from './config';
import { indent, readdirs, toPosixPath } from './utilities';
import runtime from './runtime';


async function main(args: Args) {
	const [config, configFilename] = await readConfig(args.config);

	if (args.verbose && configFilename != null) {
		console.log(configFilename);
		console.log(indent(JSON.stringify(config, null, '  '), '>>> '));
		console.log('');
	}

	const configDir = configFilename ? dirname(configFilename) : cwd();
	const configDirPosix = toPosixPath(configDir);

	if (args.verbose) {
		if (configFilename != null) {
			console.log(`[config:file]: ${configFilename}`);
		} else {
			console.log(`[config:dir]: ${configDir}`);
		}
	}

	const files = new Set<string>();

	const onAbsentDir = args.verbose
		? (path: string) => console.log(`[skip:dir]: ${path}`)
		: () => undefined;

	for await (const entry of readdirs(configDir, config.directories, onAbsentDir)) {
		if (entry.isFile()) {
			const filename = toPosixPath(resolve(entry.parentPath, entry.name));
			if (isMatch(relative(configDirPosix, filename), config.matches)) {
				files.add(filename);

				if (args.verbose) {
					console.log(`[match:file]: ${relative(configDirPosix, filename)}`);
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

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && 'code' in error;
}


interface Args {
	config?: string;
	tests: string[];
	verbose: boolean;
}

const parser = new ArgumentParser({
	usage: 'sprintest [-c CONFIG]',
	description: 'Run your tests, no more no less!',
	add_help: false,
});

parser.add_argument('-c', '--config', {
	required: false,
	help: 'explicitly provide a config file by name',
});

parser.add_argument('-v', '--verbose', {
	action: 'store_const', const: true, default: false,
	help: 'show more feedback on what sprintest does',
});

parser.add_argument('-V', '--version', {
	action: 'version',
	help: 'log sprintest\'s current version, then exit',
});

parser.add_argument('-h', '--help', {
	action: 'help', help: 'show help message, then exit',
});

main(parser.parse_args() as Args);
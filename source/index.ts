#!/usr/bin/env node
import { sep, resolve, dirname } from 'node:path';
import { relative } from 'node:path/posix';
import { runInNewContext } from 'node:vm';
import { cwd } from 'node:process';

import { ArgumentParser } from 'argparse';
import picomatch from 'picomatch';
import { build } from 'esbuild';

import { readConfig } from './config.js';
import { indent, readdirs, toPosixPath } from './utilities.js';
import createRuntime from './runtime.js';


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

const args: Args = parser.parse_args();


const [config, configFilename, spec] = await readConfig(args.config);
const configDir = spec.filenameFound ? dirname(configFilename) : cwd();
const configDirPosix = toPosixPath(configDir);

if (args.verbose) {
	if (spec.filenameFound) {
		console.log(`[config]: ${configFilename}`);
	} else {
		console.log(`[config]: ${configDir}${sep}[default]`);
	}

	console.log(indent(JSON.stringify(config, null, '  '), '[config]: '));
	console.log('');
}

function onAbsentDir(path: string) {
	if (args.verbose) {
		console.log(`[skip]: ${path}${sep} (missing)`);
	} else if (spec.directoriesProvided) {
		console.warn(`[skip]: ${path}${sep} (missing)`);
	}
}

const files = new Set<string>();

for await (const entry of readdirs(configDir, config.directories, onAbsentDir)) {
	if (entry.isFile()) {
		const filename = toPosixPath(resolve(entry.parentPath, entry.name));
		const relativeFilename = relative(configDirPosix, filename);

		if (picomatch.isMatch(relativeFilename, config.matches)) {
			files.add(filename);

			if (args.verbose) {
				console.log(`[test]: ${relativeFilename}`);
			}
		}
	}
}

if (args.verbose) {
	console.log();
}

const result = await build({
	entryPoints: [...files],
	platform: 'node',
	packages: 'external',
	bundle: true,
	write: false,
	outbase: '.',
	outdir: '.',
});

if (args.verbose) {
	for (const file of result.outputFiles) {
		console.log(`[build]: ${file.path}`);
		console.log(indent(file.text, '[build]: '));
		console.log();
	}
}

for (const file of result.outputFiles) {
	const runtime = createRuntime(file.path);
	runInNewContext(file.text, runtime, { filename: file.path });
}
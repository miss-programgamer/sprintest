#!/usr/bin/env node
import { default as osPath } from 'node:path';
import { relative } from 'node:path/posix';
import { runInNewContext } from 'node:vm';
import { cwd } from 'node:process';

import { ArgumentParser } from 'argparse';
import picomatch, { type Glob } from 'picomatch';
import { build } from 'esbuild';

import { readConfig } from './config.js';
import { toPosixPath, toOsPath, readdirs, getVersion } from './utilities.js';
import { default as console } from './console.js';
import { default as createRuntime } from './runtime.js';


interface Args {
	config?: string;
	filter?: Glob;
	verbose: number;
}


const parser = new ArgumentParser({
	usage: 'sprintest [-c CONFIG] [-f FILTER...]',
	description: 'Run your tests, no more no less!',
	add_help: false,
});

parser.add_argument('-c', '--config', {
	required: false,
	help: 'explicitly provide a config file by name',
});

parser.add_argument('-f', '--filter', {
	action: 'extend', nargs: '+',
	help: 'only run tests that match the given pattern(s)',
});

parser.add_argument('-v', '--verbose', {
	action: 'count',
	help: 'show more feedback on what sprintest does',
});

parser.add_argument('-V', '--version', {
	action: 'version', version: await getVersion(),
	help: 'log sprintest\'s current version, then exit',
});

parser.add_argument('-h', '--help', {
	action: 'help', help: 'show help message, then exit',
});

const args: Args = parser.parse_args();

if (args.filter?.length === 1) {
	args.filter = args.filter[0];
}


const [config, configFilename, spec] = await readConfig(args.config);
const configDir = spec.filenameFound ? osPath.dirname(configFilename) : cwd();
const configDirPosix = toPosixPath(configDir);

function relativeToConfig(path: string): string {
	return osPath.relative(configDir, path);
}

if (args.verbose >= 2) {
	if (spec.filenameFound) {
		console.log('config', console.stylePath(relativeToConfig(configFilename)));
	} else {
		console.log('config', console.styleDim('*default*'));
	}

	console.log('config', JSON.stringify(config, null, '  '));
	console.line();
}

function onAbsentDir(path: string) {
	if (args.verbose >= 1) {
		console.log('search', `skipped ${console.styleWarn(relativeToConfig(path))} (missing)`);
	} else if (spec.directoriesProvided) {
		console.warn('search', `skipped ${console.styleWarn(relativeToConfig(path))} (missing)`);
	}
}

const files = new Set<string>();

for await (const entry of readdirs(configDir, config.directories, onAbsentDir)) {
	if (entry.isFile()) {
		const filename = toPosixPath(osPath.resolve(entry.parentPath, entry.name));
		const relativeFilename = relative(configDirPosix, filename);

		if (picomatch.isMatch(relativeFilename, config.matches)) {
			files.add(filename);

			if (args.verbose >= 1) {
				console.log('search', console.stylePath(toOsPath(relativeFilename)));
			}
		}
	}
}

if (args.verbose >= 2) {
	console.line();
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

if (args.verbose >= 2) {
	for (const file of result.outputFiles) {
		console.log('build', console.styleFakePath(relativeToConfig(file.path)));
		console.log('build', file.text);
	}
}

if (args.verbose >= 1) {
	console.line();
}

for (const file of result.outputFiles) {
	const { filter } = args;
	const runtime = createRuntime(file.path, { filter });
	runInNewContext(file.text, runtime, { filename: file.path });
}
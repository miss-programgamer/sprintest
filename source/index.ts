#!/usr/bin/env node
import { default as osPath } from 'node:path';
import { relative } from 'node:path/posix';
import { runInNewContext } from 'node:vm';
import { cwd } from 'node:process';

import { default as picomatch, type Glob } from 'picomatch';
import { default as Parser, getVersion } from 'mimicli';
import { build } from 'esbuild';

import { readConfig } from './config.js';
import { toPosixPath, toOsPath, readdirs } from './utilities.js';
import { default as createRuntime } from './runtime.js';
import { default as console } from './console.js';


interface Args {
	config?: string;
	filter?: Glob;
	verbose: number;
	dest: string;
}


const parser = new Parser<Args>({
	usage: 'sprintest [-c CONFIG] [-f FILTER...]',
	desc: 'Run your tests, no more no less!',
	version: await getVersion(import.meta.url),
	error: 'exit',
});

parser.handle(['-c', '--config'], {
	help: 'explicitly provide a config file by name',
	action: { type: 'value' },
});

parser.handle(['-f', '--filter'], {
	help: 'only run tests that match the given pattern(s)',
	action: { type: 'value', count: '+' },
});

parser.handle(['-v', '--verbose'], {
	help: 'show more feedback on what sprintest does',
	action: { type: 'count' },
});

const args = parser.parse();


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
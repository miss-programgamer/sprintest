import { readdir, Dirent } from 'node:fs';
import { sep, resolve as resolve } from 'node:path';
import { join } from 'node:path/posix';


/**
 * Prefixes each line of the given text with the given indentation string.
 * @param text - Multiline text to modify.
 * @param indent - Indentation string to use.
 * @returns Newly indented text.
 */
export function indent(text: string, indent: string = '\t'): string {
	return text
		.split('\n')
		.map(line => `${indent}${line}`)
		.join('\n');
}

/**
 * Forces a given path to contain forward slash path separators.
 * @param path - A path to potentially convert.
 * @returns A path with all its separators coerced.
 */
export const toPosixPath = (sep === '\\')
	? (path: string): string => join(...path.split(sep))
	: (path: string): string => path;

/**
 * Recursively enumerates every file in the given directories.
 * @param root - Root directory from which the list of directories is resolved.
 * @param dirs - List of directories to traverse & search for files.
 * @param absent - Callback that signals the absence of a listed directory.
 */
export async function* readdirs(root: string, dirs: string[], absent: (path: string) => void): AsyncGenerator<Dirent> {
	for (const dir of new Set(dirs.map(dir => resolve(root, dir)))) {
		yield* await new Promise<Dirent[]>((resolve, reject) => {
			readdir(dir, { recursive: true, withFileTypes: true }, (err, files) => {
				if (err != null) {
					if (err.code === 'ENOENT') {
						absent(dir);
						resolve([]);
					} else {
						reject(err);
					}
				} else {
					resolve(files.filter(e => e.isFile()));
				}
			});
		});
	}
}
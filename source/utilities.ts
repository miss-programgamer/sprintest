import { readdir, Dirent } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { findPackageJSON } from 'node:module';
import { sep, resolve } from 'node:path';


/**
 * Forces a given path to contain posix (forward slash) path separators.
 * @param path - A path to potentially convert.
 * @returns A path with all its separators coerced.
 */
export const toPosixPath = (sep === '\\')
	? (path: string): string => path.replaceAll('\\', '/')
	: (path: string): string => path;


/**
 * Forces a given path to contain OS-specific path separators.
 * @param path - A path to potentially convert.
 * @returns A path with all its separators coerced.
 */
export const toOsPath = (sep === '\\')
	? (path: string): string => path.replaceAll('/', '\\')
	: (path: string): string => path;


/**
 * Recursively enumerates every file in the given directories.
 * @param root - Root directory from which the list of directories is resolved.
 * @param dirs - List of directories to traverse & search for files.
 * @param missing - Callback invoked in the absence of a listed directory.
 */
export async function* readdirs(root: string, dirs: string[], missing?: (path: string) => void): AsyncGenerator<Dirent> {
	for (const dir of new Set(dirs.map(dir => resolve(root, dir)))) {
		yield* await new Promise<Dirent[]>((resolve, reject) => {
			readdir(dir, { recursive: true, withFileTypes: true }, (err, files) => {
				if (err != null) {
					if (err.code === 'ENOENT') {
						missing?.(dir);
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
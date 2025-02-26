import { readdir, Dirent } from 'node:fs';
import { sep, resolve as resolve } from 'node:path';
import { join } from 'node:path/posix';


export function indent(text: string, indent: string = '\t'): string {
	return text
		.split('\n')
		.map(line => `${indent}${line}`)
		.join('\n');
}

export const toPosixPath = sep === '\\'
	? (path: string): string => join(...path.split(sep))
	: (path: string): string => path;

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
					resolve(files);
				}
			});
		});
	}
}
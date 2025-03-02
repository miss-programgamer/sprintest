import { createRequire } from 'node:module';
import { describe, it } from 'node:test';


export default function createRuntime(path: string | URL) {
	return {
		describe, it,
		console,
		require: createRequire(path),
	};
}
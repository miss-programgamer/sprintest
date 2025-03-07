import { createRequire } from 'node:module';
import { test, suite } from 'node:test';

import picomatch, { type Glob } from 'picomatch';


export type TestFn = () => void | Promise<void>;
export type SuiteFn = () => void | Promise<void>;

export type RuntimeOptions = {
	filter: Glob | undefined;
};

export type TestOptions = {
	filter: Glob | undefined;
};

export type SuiteOptions = {
	filter: Glob | undefined;
};


export default function createRuntime(path: string | URL, options: RuntimeOptions) {
	const require = createRequire(path);
	const test = createTest(options);
	const suite = createSuite(options);

	return {
		test, suite,
		describe: suite,
		it: test,
		console,
		require,
	};
}

export function createTest({ filter }: TestOptions) {
	return function (...args: any) {
		if (args.length === 1) {
			const [fn]: [TestFn] = args;
			return test({ skip: shouldSkipTest(fn.name, filter) }, async () => await fn());
		} else {
			const [name, fn]: [string, TestFn] = args;
			return test(name, { skip: shouldSkipTest(name, filter) }, async () => await fn());
		}
	};
}

export function createSuite({ filter }: SuiteOptions) {
	return function (...args: any): void | Promise<void> {
		if (args.length === 1) {
			const [fn]: [SuiteFn] = args;
			return suite({ skip: shouldSkipTest(fn.name, filter) }, async () => await fn());
		} else {
			const [name, fn]: [string, SuiteFn] = args;
			return suite(name, { skip: shouldSkipTest(name, filter) }, async () => await fn());
		}
	};
}

export function shouldSkipTest(name: string, filter: Glob | undefined): string | false {
	if (filter != null && !picomatch.isMatch(name, filter)) {
		if (filter instanceof Array) {
			return `"${name}" did not match any of [${filter.map(f => `"${f}"`).join(', ')}]`;
		} else {
			return `"${name}" did not match "${filter}"`;
		}
	} else {
		return false;
	}
}
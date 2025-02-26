# Sprintest

**Run your tests, no more no less!**

Sprintest is a unit test runner aiming to remain lightweight by minimizing its dependency count and keeping a small but useful feature set. It can run both JavaScript and TypeScript tests directly and comes pre-configured with reasonable defaults.

It does **not**, however, feature an assertion library, so you'll have to either use the built-in [`node:test`](https://nodejs.org/api/test.html) package, or an external assertion package like [Chai](https://www.chaijs.com).

# Table of Contents

1. [CLI Usage](#cli-usage)
2. [API Usage](#api-usage)
3. [Config File](#config-file)

# Documentation

Here's how Sprintest works!

## CLI Usage

The command line tool `sprintest` can be invoked thusly:

```
usage: sprintest [-c CONFIG]

optional arguments:
  -c, --config CONFIG   explicitly provide a config file by name
  -v, --verbose         show more feedback on what sprintest does
  -V, --version         log sprintest's current version, then exit
  -h, --help            show help message, then exit
```

If a config file is not explicitly provided, Sprintest will look for one named `sprintest.json` in the current directory and use it to locate your tests.

## API Usage

Sprintest injects a few functions into the global scope of your tests and provides a type definition file for said functions. The signatures for these functions and the expected format for test callbacks is listed below.

```ts
type SuiteFn = (s: any) => void | Promise<void>;
type TestFn = (t: any, done: (result?: any) => void) => void | Promise<void>;

function describe(name?: string, fn?: SuiteFn): Promise<void>;
function describe(fn?: SuiteFn): Promise<void>;

function it(name?: string, fn?: TestFn): Promise<void>;
function it(fn?: TestFn): Promise<void>;
```

Usage of these mirrors the functions of the same name found in the built-in package [`node:test`](https://nodejs.org/api/test.html).

Here is a contrived but working example:

```ts
const assert = require('node:assert');

describe('SomeClass', () => {
	it('should work right', () => {
		assert(true);
	});
});
```

## Config File

A Sprintest config file is a JSON file consisting of two fields: `directories` and `matches`, which are both arrays of strings. `directories` is a list of directories relative to the config file to recursively search, and `matches` is a list of patterns matched against the files found this way. The `matches` patterns are checked against the relative path of each test file to the config file.

For more information on writing match patterns, check the documentation for [picomatch](https://www.npmjs.com/package/picomatch), the pattern matching library Sprintest uses.

If a config file is not found, Sprintest will behave as if the following config file contents were provided:

```json
{
	"directories": [
		"src", "source",
		"test", "tests"
	],
	"matches": [
		"**/*.test.js",
		"**/*.test.ts"
	]
}
```
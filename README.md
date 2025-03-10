# Sprintest

**Run your tests, no more no less!**

Sprintest is a unit test runner aiming to remain lightweight by minimizing its dependency count and keeping a small but useful feature set. It can run both JavaScript and TypeScript tests directly and comes pre-configured with reasonable defaults.

It does **not**, however, feature an assertion library, so you'll have to either use the built-in [`node:assert`](https://nodejs.org/api/assert.html) package, or an external assertion package like [Chai](https://www.chaijs.com).

# Table of Contents

- [CLI Usage](#cli-usage)
- [API Usage](#api-usage)
- [Config File](#config-file)

# Documentation

Here's how Sprintest works!

## CLI Usage

The command line tool `sprintest` can be invoked thusly:

```
usage: sprintest [-c CFG] [-f FLT...]

optional arguments:
  -c, --config CFG      explicitly provide a config file by name
  -f, --filter [FLT...] only run tests that match the given pattern(s)
  -v, --verbose         show more feedback on what sprintest does
  -V, --version         log sprintest's current version, then exit
  -h, --help            show help message, then exit
```

If a config file is not explicitly provided, Sprintest will look for one named `sprintest.json` in the current directory. If one does not exist, srpintest will fall back to using default values as explained in [Config File](#config-file).

The value(s) given as filters are [picomatch](https://www.npmjs.com/package/picomatch) glob patterns and get matched against your test and suite names. Note that both suite, test, and subtest names must match at least one of the provided filters to be run.

```cmd
sprintest -f SomeSuite "some test name"
```

## API Usage

Sprintest injects a few functions into your tests' global scope and provides type definitions for them. Their signatures and the format of test callbacks functions is documented below. Note that `describe` and `it` are merely aliases of `suite` and `test` respectively.

```ts
type TestFn = () => void | Promise<void>;
type SuiteFn = () => void | Promise<void>;

function suite(name?: string, fn?: SuiteFn): Promise<void>;
function suite(fn?: SuiteFn): Promise<void>;

function test(name?: string, fn?: TestFn): Promise<void>;
function test(fn?: TestFn): Promise<void>;

function describe(name?: string, fn?: SuiteFn): Promise<void>;
function describe(fn?: SuiteFn): Promise<void>;

function it(name?: string, fn?: TestFn): Promise<void>;
function it(fn?: TestFn): Promise<void>;
```

Usage of these functions mirrors those with the same name found in the built-in package [`node:test`](https://nodejs.org/api/test.html).

Here is a contrived but working example:

```ts
const assert = require('node:assert');

// Using describe/it functions.
describe('SomeClass', () => {
	it('should work right', () => {
		assert(true);
	});
});

// Using suite/test functions.
suite('SomeFunc', () => {
	test('should work right', () => {
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
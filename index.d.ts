export { };


type TestFn = () => void | Promise<void>;
type SuiteFn = () => void | Promise<void>;

declare global {
	function suite(name?: string, fn?: SuiteFn): Promise<void>;
	function suite(fn?: SuiteFn): Promise<void>;

	function test(name?: string, fn?: TestFn): Promise<void>;
	function test(fn?: TestFn): Promise<void>;

	function describe(name?: string, fn?: SuiteFn): Promise<void>;
	function describe(fn?: SuiteFn): Promise<void>;

	function it(name?: string, fn?: TestFn): Promise<void>;
	function it(fn?: TestFn): Promise<void>;
}
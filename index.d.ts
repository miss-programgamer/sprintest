export { };


type SuiteFn = (s: any) => void | Promise<void>;
type TestFn = (t: any, done: (result?: any) => void) => void | Promise<void>;

declare global {
	function describe(name?: string, fn?: SuiteFn): Promise<void>;
	function describe(fn?: SuiteFn): Promise<void>;

	function it(name?: string, fn?: TestFn): Promise<void>;
	function it(fn?: TestFn): Promise<void>;
}
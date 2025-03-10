import { format, styleText } from 'node:util';


let globalConsole = globalThis.console;


let console = {
	log(scope: string | null, ...args: any[]) {
		globalConsole.log(formatScope(scope, ...args));
	},
	warn(scope: string | null, ...args: any[]) {
		globalConsole.warn(formatScope(scope, ...args));
	},
	error(scope: string | null, ...args: any[]) {
		globalConsole.error(formatScope(scope, ...args));
	},
	line() {
		globalConsole.log();
	},
	styleScope(text: string): string {
		return styleText(['gray'], text);
	},
	stylePath(text: string): string {
		return styleText(['cyan', 'underline'], text);
	},
	styleFakePath(text: string): string {
		return styleText(['cyan'], text);
	},
	styleDim(text: string): string {
		return styleText(['gray'], text);
	},
	styleWarn(text: string): string {
		return styleText(['yellow'], text);
	},
	styleError(text: string): string {
		return styleText(['underline', 'red'], text);
	},
};

export function formatScope(scope: string | null, ...args: any[]): string {
	if (scope != null) {
		const scopeName = console.styleScope(scope);
		return format('%s', ...args).trimEnd().split('\n').map(line => `[${scopeName}] ${line}`).join('\n');
	} else {
		return format('%s', ...args);
	}
}

export default console;
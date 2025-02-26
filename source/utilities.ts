export function indent(text: string, indent: string = '\t'): string {
	return text
		.split('\n')
		.map(line => `${indent}${line}`)
		.join('\n');
}
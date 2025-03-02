import { expect } from 'chai';
import getValue from './example.js';


describe('SomeClass', () => {
	it('should work', () => {
		expect(getValue()).equals(42);
	});
});
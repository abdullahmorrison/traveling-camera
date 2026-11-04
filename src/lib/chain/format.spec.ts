import { describe, expect, it } from 'vitest';
import { formatTimeLeft, placeLine } from './format';

const HOUR = 60 * 60 * 1000;

describe('formatTimeLeft', () => {
	it('shows days and hours while days remain', () => {
		expect(formatTimeLeft(5 * 24 * HOUR + 14 * HOUR + 59 * 60_000)).toBe('5d 14h');
	});

	it('switches to hours and minutes on the last day', () => {
		expect(formatTimeLeft(6 * HOUR + 12 * 60_000)).toBe('6h 12m');
		expect(formatTimeLeft(0)).toBe('0h 0m');
	});
});

describe('placeLine', () => {
	it('joins neighbourhood and city', () => {
		expect(
			placeLine({ neighbourhood: 'Capitol Hill', city: 'Seattle', country: 'United States' })
		).toBe('Capitol Hill, Seattle');
	});

	it('falls back to the country, then to a placeholder', () => {
		expect(placeLine({ neighbourhood: null, city: null, country: 'Iceland' })).toBe('Iceland');
		expect(placeLine({ neighbourhood: null, city: null, country: null })).toBe('Somewhere');
	});
});

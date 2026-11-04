import { describe, expect, it } from 'vitest';
import { HANDOFF_RESOLUTION, PHOTO_RESOLUTION, areTogether, isCellAt, toCell } from './geo';

const capitolHill = toCell(47.6235, -122.3195, HANDOFF_RESOLUTION);

describe('areTogether', () => {
	it('accepts the same hexagon', () => {
		expect(areTogether(capitolHill, capitolHill)).toBe(true);
	});

	it('accepts a neighbouring hexagon across the street', () => {
		const nearby = toCell(47.6249, -122.3195, HANDOFF_RESOLUTION);
		expect(nearby).not.toBe(capitolHill);
		expect(areTogether(capitolHill, nearby)).toBe(true);
	});

	it('rejects phones a few kilometres apart', () => {
		const downtown = toCell(47.608, -122.3352, HANDOFF_RESOLUTION);
		expect(areTogether(capitolHill, downtown)).toBe(false);
	});

	it('rejects phones on different continents', () => {
		const london = toCell(51.5072, -0.1276, HANDOFF_RESOLUTION);
		expect(areTogether(capitolHill, london)).toBe(false);
	});

	it('rejects cells at the wrong resolution or malformed input', () => {
		const coarse = toCell(47.6235, -122.3195, PHOTO_RESOLUTION);
		expect(areTogether(capitolHill, coarse)).toBe(false);
		expect(areTogether(capitolHill, 'not-a-cell')).toBe(false);
	});
});

describe('isCellAt', () => {
	it('checks the resolution of a cell', () => {
		expect(isCellAt(capitolHill, HANDOFF_RESOLUTION)).toBe(true);
		expect(isCellAt(capitolHill, PHOTO_RESOLUTION)).toBe(false);
	});
});

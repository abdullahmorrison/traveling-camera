import { describe, expect, it, vi } from 'vitest';
import { HANDOFF_RESOLUTION, PHOTO_RESOLUTION, toCell } from '../geo';
import { openDb } from './db';
import { NO_PLACE, Places, parseNominatim } from './places';

const cell = toCell(47.6235, -122.3195, PHOTO_RESOLUTION);
const seattle = {
	address: {
		neighbourhood: 'Capitol Hill',
		city: 'Seattle',
		state: 'Washington',
		country: 'United States'
	}
};

const respond = (body: unknown, status = 200) =>
	vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('parseNominatim', () => {
	it('reads neighbourhood, city, region and country', () => {
		expect(parseNominatim(seattle)).toEqual({
			neighbourhood: 'Capitol Hill',
			city: 'Seattle',
			region: 'Washington',
			country: 'United States'
		});
	});

	it('falls back through smaller place types', () => {
		expect(
			parseNominatim({ address: { suburb: 'Fremont', town: 'Wenatchee', county: 'Chelan' } })
		).toMatchObject({ neighbourhood: 'Fremont', city: 'Wenatchee', region: 'Chelan' });
	});

	it('handles responses without an address', () => {
		expect(parseNominatim({ error: 'Unable to geocode' })).toEqual(NO_PLACE);
		expect(parseNominatim(null)).toEqual(NO_PLACE);
	});
});

describe('Places', () => {
	it('sends only the cell centre and caches the answer', async () => {
		const fetch = respond(seattle);
		const places = new Places(openDb(':memory:'), { enabled: true, fetch, minGapMs: 0 });

		expect((await places.lookup(cell)).neighbourhood).toBe('Capitol Hill');
		expect((await places.lookup(cell)).city).toBe('Seattle');
		expect(fetch).toHaveBeenCalledTimes(1);
		const url = new URL((fetch.mock.calls[0] as unknown as [string])[0]);
		expect(url.searchParams.get('lat')).not.toBe('47.6235');
	});

	it('does not call out when disabled or for precise cells', async () => {
		const fetch = respond(seattle);
		const places = new Places(openDb(':memory:'), { enabled: false, fetch });
		expect(await places.lookup(cell)).toEqual(NO_PLACE);

		const enabled = new Places(openDb(':memory:'), { enabled: true, fetch, minGapMs: 0 });
		expect(await enabled.lookup(toCell(47.6235, -122.3195, HANDOFF_RESOLUTION))).toEqual(NO_PLACE);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('returns no place on errors and retries next time', async () => {
		const fetch = respond({}, 503);
		const places = new Places(openDb(':memory:'), { enabled: true, fetch, minGapMs: 0 });
		expect(await places.lookup(cell)).toEqual(NO_PLACE);
		await places.lookup(cell);
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('spaces requests out', async () => {
		const stamps: number[] = [];
		const fetch = vi.fn(async () => {
			stamps.push(Date.now());
			return new Response(JSON.stringify(seattle));
		});
		const places = new Places(openDb(':memory:'), { enabled: true, fetch, minGapMs: 50 });
		const other = toCell(51.5072, -0.1276, PHOTO_RESOLUTION);
		await Promise.all([places.lookup(cell), places.lookup(other)]);
		expect(stamps[1]! - stamps[0]!).toBeGreaterThanOrEqual(45);
	});
});

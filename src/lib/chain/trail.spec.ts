import { describe, expect, it } from 'vitest';
import { PHOTO_RESOLUTION, toCell } from '../geo';
import { buildTrail, distanceKm, focusStops, type TrailPhoto } from './trail';

let position = 0;
function photo(lat: number, lng: number, place: Partial<TrailPhoto['place']>): TrailPhoto {
	position += 1;
	return {
		position,
		url: `/photos/${position}.jpg`,
		cell: toCell(lat, lng, PHOTO_RESOLUTION),
		place: { neighbourhood: null, city: null, region: null, country: null, ...place }
	};
}

const us = { region: 'Washington', country: 'United States' };
position = 0;
const london = photo(51.5072, -0.1276, {
	neighbourhood: 'Soho',
	city: 'London',
	region: 'England',
	country: 'United Kingdom'
});
const downtown = photo(47.608, -122.3352, { neighbourhood: 'Downtown', city: 'Seattle', ...us });
const queenAnne1 = photo(47.637, -122.357, { neighbourhood: 'Queen Anne', city: 'Seattle', ...us });
const queenAnne2 = photo(47.6372, -122.3572, {
	neighbourhood: 'Queen Anne',
	city: 'Seattle',
	...us
});
const spokane = photo(47.6588, -117.426, { neighbourhood: 'Browne', city: 'Spokane', ...us });
const photos = [london, downtown, queenAnne1, queenAnne2, spokane];

describe('buildTrail', () => {
	it('pins neighbourhoods and stacks repeat visits', () => {
		const trail = buildTrail(photos, 'neighbourhood');
		expect(trail.stops.map((s) => [s.label, s.positions])).toEqual([
			['Soho', [1]],
			['Downtown', [2]],
			['Queen Anne', [3, 4]],
			['Browne', [5]]
		]);
		expect(trail.stops[2]!.urls).toEqual(['/photos/4.jpg', '/photos/3.jpg']);
		expect(trail.path).toEqual([0, 1, 2, 3]);
	});

	it('pins cities in the region view, regions in the country view, countries in the world view', () => {
		expect(buildTrail(photos, 'region').stops.map((s) => s.label)).toEqual([
			'London',
			'Seattle',
			'Spokane'
		]);
		expect(buildTrail(photos, 'country').stops.map((s) => s.label)).toEqual([
			'England',
			'Washington'
		]);
		const world = buildTrail(photos, 'world');
		expect(world.stops.map((s) => [s.label, s.positions.length])).toEqual([
			['United Kingdom', 1],
			['United States', 4]
		]);
	});

	it('returns to an earlier pin when the camera comes back', () => {
		position = 10;
		const back = photo(51.5, -0.12, { country: 'United Kingdom' });
		const trail = buildTrail([...photos, back], 'world');
		expect(trail.path).toEqual([0, 1, 0]);
	});

	it('keeps unnamed places apart by cell', () => {
		position = 20;
		const a = photo(10, 10, {});
		const b = photo(20, 20, {});
		expect(buildTrail([a, b], 'neighbourhood').stops.map((s) => s.label)).toEqual([
			'Somewhere',
			'Somewhere'
		]);
	});
});

describe('focusStops', () => {
	it('fits the city of the latest photo at neighbourhood level', () => {
		const withLatestInSeattle = photos.filter((p) => p !== spokane);
		const trail = buildTrail(withLatestInSeattle, 'neighbourhood');
		expect(focusStops(withLatestInSeattle, trail, 'neighbourhood').map((s) => s.label)).toEqual([
			'Downtown',
			'Queen Anne'
		]);
	});

	it('fits everything at world level', () => {
		const trail = buildTrail(photos, 'world');
		expect(focusStops(photos, trail, 'world')).toHaveLength(2);
	});
});

describe('distanceKm', () => {
	it('adds up the hops between photos', () => {
		const km = distanceKm([london, downtown]);
		expect(km).toBeGreaterThan(7600);
		expect(km).toBeLessThan(7800);
		expect(distanceKm([downtown])).toBe(0);
	});
});

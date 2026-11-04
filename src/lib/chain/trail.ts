import { cellCenter } from '../geo';

export type ZoomLevel = 'neighbourhood' | 'region' | 'country' | 'world';
export const ZOOM_LEVELS: ZoomLevel[] = ['neighbourhood', 'region', 'country', 'world'];

export interface TrailPhoto {
	position: number;
	url: string;
	cell: string;
	place: {
		neighbourhood: string | null;
		city: string | null;
		region: string | null;
		country: string | null;
	};
}

export interface Stop {
	key: string;
	label: string;
	lat: number;
	lng: number;
	/** Holder positions at this stop, in chain order. */
	positions: number[];
	/** Up to three photo URLs, newest first, for the pin's print stack. */
	urls: string[];
}

export interface Trail {
	stops: Stop[];
	/** Indexes into `stops`, in the order the camera travelled. */
	path: number[];
}

/**
 * Each zoom level groups photos one unit smaller than its extent:
 * neighbourhood view pins neighbourhoods, region view pins cities,
 * country view pins regions, world view pins countries.
 */
const grouping: Record<ZoomLevel, (p: TrailPhoto['place']) => (string | null)[]> = {
	neighbourhood: (p) => [p.neighbourhood, p.city, p.country],
	region: (p) => [p.city, p.region, p.country],
	country: (p) => [p.region, p.country],
	world: (p) => [p.country]
};

/** The area a level is focused on, used to pick which stops to fit on screen. */
const scope: Record<ZoomLevel, (p: TrailPhoto['place']) => string | null> = {
	neighbourhood: (p) => p.city ?? p.region ?? p.country,
	region: (p) => p.region ?? p.country,
	country: (p) => p.country,
	world: () => 'world'
};

function groupKey(photo: TrailPhoto, level: ZoomLevel): { key: string; label: string } {
	const parts = grouping[level](photo.place);
	if (parts[0]) return { key: parts.map((part) => part ?? '').join('|'), label: parts[0] };
	// Unnamed places stay separate per cell rather than collapsing into one pin.
	return { key: `cell:${photo.cell}`, label: 'Somewhere' };
}

export function buildTrail(photos: TrailPhoto[], level: ZoomLevel): Trail {
	const ordered = [...photos].sort((a, b) => a.position - b.position);
	const stops: Stop[] = [];
	const indexByKey = new Map<string, number>();
	const sums: { lat: number; lng: number }[] = [];
	const path: number[] = [];

	for (const photo of ordered) {
		const { key, label } = groupKey(photo, level);
		let index = indexByKey.get(key);
		if (index === undefined) {
			index = stops.length;
			indexByKey.set(key, index);
			stops.push({ key, label, lat: 0, lng: 0, positions: [], urls: [] });
			sums.push({ lat: 0, lng: 0 });
		}
		const stop = stops[index]!;
		const center = cellCenter(photo.cell);
		sums[index]!.lat += center.lat;
		sums[index]!.lng += center.lng;
		stop.positions.push(photo.position);
		stop.urls = [photo.url, ...stop.urls].slice(0, 3);
		if (path.at(-1) !== index) path.push(index);
	}

	stops.forEach((stop, i) => {
		stop.lat = sums[i]!.lat / stop.positions.length;
		stop.lng = sums[i]!.lng / stop.positions.length;
	});
	return { stops, path };
}

/** The stops worth fitting on screen at this level: those in the same area as the latest photo. */
export function focusStops(photos: TrailPhoto[], trail: Trail, level: ZoomLevel): Stop[] {
	const latest = [...photos].sort((a, b) => b.position - a.position)[0];
	if (!latest) return [];
	const area = scope[level](latest.place);
	if (!area) return trail.stops;
	const keys = new Set(
		photos.filter((p) => scope[level](p.place) === area).map((p) => groupKey(p, level).key)
	);
	return trail.stops.filter((stop) => keys.has(stop.key));
}

const EARTH_RADIUS_KM = 6371;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
	const rad = Math.PI / 180;
	const dLat = (b.lat - a.lat) * rad;
	const dLng = (b.lng - a.lng) * rad;
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Distance along the photos in chain order, between cell centres. */
export function distanceKm(photos: TrailPhoto[]): number {
	const points = [...photos].sort((a, b) => a.position - b.position).map((p) => cellCenter(p.cell));
	let total = 0;
	for (let i = 1; i < points.length; i++) total += haversineKm(points[i - 1]!, points[i]!);
	return total;
}

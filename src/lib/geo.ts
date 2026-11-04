import { cellToLatLng, gridDistance, isValidCell, getResolution, latLngToCell } from 'h3-js';

/** H3 resolution used to check two phones are together (~200 m hexagons). */
export const HANDOFF_RESOLUTION = 9;
/** H3 resolution stored with a photo (~1.4 km hexagons): enough for a neighbourhood, never a home. */
export const PHOTO_RESOLUTION = 7;

export function toCell(lat: number, lng: number, resolution: number): string {
	return latLngToCell(lat, lng, resolution);
}

export function cellCenter(cell: string): { lat: number; lng: number } {
	const [lat, lng] = cellToLatLng(cell);
	return { lat, lng };
}

export function isCellAt(cell: string, resolution: number): boolean {
	return isValidCell(cell) && getResolution(cell) === resolution;
}

/** True when two handoff cells are the same hexagon or touching ones. */
export function areTogether(a: string, b: string): boolean {
	if (!isCellAt(a, HANDOFF_RESOLUTION) || !isCellAt(b, HANDOFF_RESOLUTION)) return false;
	try {
		return gridDistance(a, b) <= 1;
	} catch {
		// h3 throws when cells are too far apart to measure (e.g. across a pentagon).
		return false;
	}
}

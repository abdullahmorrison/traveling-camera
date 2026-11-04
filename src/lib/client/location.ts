import { toCell } from '#lib/geo.js';

export class LocationError extends Error {
	constructor(readonly reason: 'denied' | 'unavailable') {
		super(reason);
	}
}

/**
 * Asks the browser for the current position and returns only an H3 cell at
 * `resolution`. The raw coordinates never leave this function.
 */
export function currentCell(resolution: number): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!('geolocation' in navigator)) {
			reject(new LocationError('unavailable'));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			({ coords }) => resolve(toCell(coords.latitude, coords.longitude, resolution)),
			(error) =>
				reject(
					new LocationError(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable')
				),
			{ enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 }
		);
	});
}

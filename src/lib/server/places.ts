import { cellCenter, isCellAt, PHOTO_RESOLUTION } from '../geo';
import type { Place } from './chains';
import type { Db } from './db';

export const NO_PLACE: Place = { neighbourhood: null, city: null, region: null, country: null };

/** Nominatim's usage policy asks for at most one request per second and an identifying agent. */
const MIN_GAP_MS = 1100;
const USER_AGENT = 'traveling-camera/1.0 (+https://travelingcamera.app)';

type Address = Record<string, string | undefined>;

const first = (address: Address, keys: string[]) =>
	keys.map((key) => address[key]).find((value) => !!value) ?? null;

/** Picks the place names we show from a Nominatim reverse-geocoding response. */
export function parseNominatim(body: unknown): Place {
	const address = (body as { address?: Address } | null)?.address;
	if (!address) return NO_PLACE;
	return {
		neighbourhood: first(address, ['neighbourhood', 'suburb', 'quarter', 'city_district']),
		city: first(address, ['city', 'town', 'village', 'municipality', 'hamlet']),
		region: first(address, ['state', 'region', 'province', 'county']),
		country: first(address, ['country'])
	};
}

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Names a photo's coarse cell. Only the cell's centre is sent to the
 * geocoder, so a photo taken at home resolves to its neighbourhood.
 */
export class Places {
	private queue: Promise<unknown> = Promise.resolve();
	private lastRequestAt = 0;

	constructor(
		private readonly db: Db,
		private readonly options: { enabled: boolean; fetch?: Fetch; minGapMs?: number }
	) {}

	async lookup(cell: string): Promise<Place> {
		if (!isCellAt(cell, PHOTO_RESOLUTION)) return NO_PLACE;
		const cached = this.db
			.prepare('SELECT neighbourhood, city, region, country FROM places WHERE cell = ?')
			.get(cell) as Place | undefined;
		if (cached) return { ...cached };
		if (!this.options.enabled) return NO_PLACE;

		const place = await this.throttled(() => this.fetchPlace(cell)).catch(() => null);
		if (!place) return NO_PLACE;
		this.db
			.prepare(
				`INSERT OR REPLACE INTO places (cell, neighbourhood, city, region, country, fetched_at)
				 VALUES (?, ?, ?, ?, ?, ?)`
			)
			.run(cell, place.neighbourhood, place.city, place.region, place.country, Date.now());
		return place;
	}

	private async fetchPlace(cell: string): Promise<Place> {
		const { lat, lng } = cellCenter(cell);
		const url =
			'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=en' +
			`&lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`;
		const response = await (this.options.fetch ?? fetch)(url, {
			headers: { 'user-agent': USER_AGENT },
			signal: AbortSignal.timeout(8000)
		});
		if (!response.ok) throw new Error(`geocoder responded ${response.status}`);
		return parseNominatim(await response.json());
	}

	/** Runs requests one at a time with a minimum gap between them. */
	private throttled<T>(work: () => Promise<T>): Promise<T> {
		const run = async () => {
			const wait = this.lastRequestAt + (this.options.minGapMs ?? MIN_GAP_MS) - Date.now();
			if (wait > 0) await new Promise((done) => setTimeout(done, wait));
			this.lastRequestAt = Date.now();
			return work();
		};
		const result = this.queue.then(run, run);
		this.queue = result.catch(() => {});
		return result;
	}
}

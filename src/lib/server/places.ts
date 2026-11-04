import type { Place } from './chains';

/** Resolves a photo cell to place names. Real lookup lands in a later change. */
export async function lookupPlace(_cell: string): Promise<Place> {
	return { neighbourhood: null, city: null, region: null, country: null };
}

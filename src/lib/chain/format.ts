const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** "5d 14h" while days remain, then "6h 12m". */
export function formatTimeLeft(ms: number): string {
	if (ms >= DAY) return `${Math.floor(ms / DAY)}d ${Math.floor((ms % DAY) / HOUR)}h`;
	const minutes = Math.floor((ms % HOUR) / 60_000);
	return `${Math.floor(ms / HOUR)}h ${minutes}m`;
}

/** The place line under a photo: "CAPITOL HILL, SEATTLE". */
export function placeLine(place: {
	neighbourhood: string | null;
	city: string | null;
	country: string | null;
}): string {
	const parts = [place.neighbourhood, place.city].filter(Boolean);
	if (parts.length === 0 && place.country) parts.push(place.country);
	return parts.length ? parts.join(', ') : 'Somewhere';
}

import { join } from 'node:path';
import type { Cookies } from '@sveltejs/kit';
import { DATA_DIR, GEOCODER } from '$app/env/private';
import { Chains } from './chains';
import { openDb } from './db';
import { Places } from './places';

export const photoDir = join(DATA_DIR, 'photos');
const db = openDb(join(DATA_DIR, 'app.db'));
export const chains = new Chains(db);
export const places = new Places(db, { enabled: GEOCODER === 'nominatim' });

const HOLDER_COOKIE = 'tc_holder';

export function readHolderToken(cookies: Cookies): string | null {
	return cookies.get(HOLDER_COOKIE) ?? null;
}

export function setHolderToken(cookies: Cookies, token: string): void {
	cookies.set(HOLDER_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 365 * 5
	});
}

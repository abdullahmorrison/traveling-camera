import { error } from '@sveltejs/kit';
import { dev } from '$app/env';
import { ADMIN_OPEN } from '$app/env/private';

/** /admin is open in dev or when ADMIN_OPEN=true; in production Cloudflare Access guards it. */
export function requireAdmin(): void {
	if (!dev && !ADMIN_OPEN) error(404, 'Not found');
}

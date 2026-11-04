import { error, json } from '@sveltejs/kit';
import { chains } from '#lib/server/app.js';
import { readJson, rule } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

/**
 * Called by the holder's QR screen every few seconds: returns a fresh code
 * plus whether the camera was taken or the last person declined.
 */
export const POST: RequestHandler = async ({ request, locals, url }) => {
	const token = locals.holderToken;
	if (!token) error(403, 'not_holder');
	const { cell } = await readJson<{ cell: string }>(request);
	const state = rule(() => chains.handoffState(token));
	if (state.passed) return json({ passed: true });
	const code = rule(() => chains.issueCode(token, String(cell ?? ''), new Date()));
	return json({
		passed: false,
		code,
		url: new URL(`/h/${code}`, url.origin).href,
		lastDeclinedAt: state.lastDeclinedAt?.toISOString() ?? null
	});
};

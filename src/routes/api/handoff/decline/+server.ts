import { json } from '@sveltejs/kit';
import { chains } from '#lib/server/app.js';
import { readJson, rule } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

/** The person asked said no; the giver's screen shows it on its next refresh. */
export const POST: RequestHandler = async ({ request }) => {
	const { code } = await readJson<{ code: string }>(request);
	rule(() => chains.decline(String(code ?? ''), new Date()));
	return json({ ok: true });
};

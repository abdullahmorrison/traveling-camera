import { json } from '@sveltejs/kit';
import { chains, setHolderToken } from '#lib/server/app.js';
import { readJson, rule } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

/** The receiver takes the camera. Both phones must be together. */
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const { code, cell } = await readJson<{ code: string; cell: string }>(request);
	const received = rule(() =>
		chains.accept(
			String(code ?? ''),
			String(cell ?? ''),
			new Date(),
			locals.holderToken ?? undefined
		)
	);
	setHolderToken(cookies, received.token);
	return json({ chainId: received.chainId, position: received.position });
};

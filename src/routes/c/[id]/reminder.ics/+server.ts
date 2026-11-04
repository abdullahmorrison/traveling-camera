import { error } from '@sveltejs/kit';
import { passDeadline } from '#lib/chain/deadline.js';
import { reminderIcs } from '#lib/chain/calendar.js';
import { chains } from '#lib/server/app.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, locals, url }) => {
	const chainId = Number(params.id);
	const me = locals.holderToken ? chains.holderByToken(locals.holderToken) : undefined;
	if (!me || me.chainId !== chainId || me.passedAt) error(404, 'Not found');
	const body = reminderIcs(
		chainId,
		passDeadline(me.receivedAt),
		new URL(`/c/${chainId}`, url.origin).href,
		new Date()
	);
	return new Response(body, {
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			'content-disposition': 'attachment; filename="pass-the-camera.ics"'
		}
	});
};

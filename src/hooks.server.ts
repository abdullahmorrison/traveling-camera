import type { Handle } from '@sveltejs/kit/hooks';
import { readHolderToken } from '#lib/server/app.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.holderToken = readHolderToken(event.cookies);
	return resolve(event);
};

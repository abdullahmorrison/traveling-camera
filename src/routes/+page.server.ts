import { chains } from '#lib/server/app.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const holder = locals.holderToken ? chains.holderByToken(locals.holderToken) : undefined;
	return { chainId: holder?.chainId ?? null };
};

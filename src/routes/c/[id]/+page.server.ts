import { error } from '@sveltejs/kit';
import { chains } from '#lib/server/app.js';
import { chainView } from '#lib/server/views.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals }) => {
	const chain = chainView(chains, Number(params.id), locals.holderToken, new Date());
	if (!chain) error(404, 'No such chain');
	return { chain };
};

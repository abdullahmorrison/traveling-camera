import { error } from '@sveltejs/kit';
import { chains } from '#lib/server/app.js';
import { chainView } from '#lib/server/views.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals }) => {
	const chain = chainView(chains, Number(params.id), locals.holderToken, new Date());
	const index = chain?.photos.findIndex((p) => p.position === Number(params.position)) ?? -1;
	if (!chain || index < 0) error(404, 'No such photo');
	return {
		chainId: chain.id,
		holderCount: chain.holderCount,
		photo: chain.photos[index]!,
		previous: chain.photos[index - 1]?.position ?? null,
		next: chain.photos[index + 1]?.position ?? null
	};
};

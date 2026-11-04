import { redirect } from '@sveltejs/kit';
import { chains } from '#lib/server/app.js';
import { photoUrl } from '#lib/server/views.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals }) => {
	const me = locals.holderToken ? chains.holderByToken(locals.holderToken) : undefined;
	if (!me || me.chainId !== Number(params.id) || !me.passedAt) redirect(303, `/c/${params.id}`);
	const photo = chains.photoOf(me.id);
	return { position: me.position, photoUrl: photo ? photoUrl(photo.file) : null };
};

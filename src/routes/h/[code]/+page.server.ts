import { error } from '@sveltejs/kit';
import { chains } from '#lib/server/app.js';
import { photoUrl } from '#lib/server/views.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const now = new Date();
	const { status, chainId } = chains.codeStatus(params.code, now);
	if (status === 'unknown' || chainId === undefined) error(404, 'This code is not valid');

	const holders = chains.holders(chainId);
	const photos = chains.photos(chainId);
	const first = photos[0]?.place;
	return {
		code: params.code,
		status,
		chainId,
		before: holders.length,
		startedAt: holders[0]!.receivedAt.toISOString(),
		origin: first?.city ?? first?.country ?? null,
		faces: photos
			.slice(-7)
			.reverse()
			.map((photo) => photoUrl(photo.file))
	};
};

import { redirect } from '@sveltejs/kit';
import { chains, setHolderToken } from '#lib/server/app.js';
import { requireAdmin } from '#lib/server/admin.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	requireAdmin();
};

export const actions: Actions = {
	start: ({ cookies }) => {
		requireAdmin();
		const { chainId, token } = chains.start(new Date());
		setHolderToken(cookies, token);
		redirect(303, `/c/${chainId}`);
	}
};

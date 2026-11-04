import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { error } from '@sveltejs/kit';
import { photoDir } from '#lib/server/app.js';
import type { RequestHandler } from './$types';

const FILE_NAME = /^[0-9a-f-]{36}\.jpg$/;

export const GET: RequestHandler = async ({ params }) => {
	if (!FILE_NAME.test(params.file)) error(404, 'Not found');
	const bytes = await readFile(join(photoDir, params.file)).catch(() => null);
	if (!bytes) error(404, 'Not found');
	return new Response(new Uint8Array(bytes), {
		headers: {
			'content-type': 'image/jpeg',
			'cache-control': 'public, max-age=31536000, immutable'
		}
	});
};

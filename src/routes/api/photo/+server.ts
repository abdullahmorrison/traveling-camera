import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { error, json } from '@sveltejs/kit';
import { ChainError } from '#lib/server/chains.js';
import { chains, photoDir } from '#lib/server/app.js';
import { lookupPlace } from '#lib/server/places.js';
import type { RequestHandler } from './$types';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_CAPTION = 500;

/** Saves the holder's photo (multipart: photo, caption, cell). */
export const POST: RequestHandler = async ({ request, locals }) => {
	const token = locals.holderToken;
	if (!token) error(403, 'Only the holder can take the photo');
	const holder = chains.holderByToken(token);
	if (!holder) error(403, 'Only the holder can take the photo');

	const form = await request.formData();
	const file = form.get('photo');
	const caption = String(form.get('caption') ?? '').trim();
	const cell = String(form.get('cell') ?? '');
	if (!(file instanceof File) || file.type !== 'image/jpeg') error(400, 'Expected a JPEG photo');
	if (file.size > MAX_BYTES) error(413, 'Photo too large');
	if (caption.length > MAX_CAPTION) error(400, 'Caption too long');

	const previous = chains.photoOf(holder.id);
	const name = `${randomUUID()}.jpg`;
	await mkdir(photoDir, { recursive: true });
	await writeFile(join(photoDir, name), new Uint8Array(await file.arrayBuffer()));

	try {
		const place = await lookupPlace(cell);
		chains.savePhoto(token, { file: name, caption, cell, place }, new Date());
	} catch (cause) {
		await unlink(join(photoDir, name)).catch(() => {});
		if (cause instanceof ChainError) error(409, cause.code);
		throw cause;
	}
	if (previous) await unlink(join(photoDir, previous.file)).catch(() => {});
	return json({ chainId: holder.chainId });
};

/** Updates only the caption. */
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.holderToken) error(403, 'Only the holder can edit the caption');
	const { caption } = (await request.json()) as { caption?: unknown };
	if (typeof caption !== 'string' || caption.length > MAX_CAPTION) error(400, 'Bad caption');
	try {
		chains.setCaption(locals.holderToken, caption.trim(), new Date());
	} catch (cause) {
		if (cause instanceof ChainError) error(409, cause.code);
		throw cause;
	}
	return json({ ok: true });
};

import { beforeEach, describe, expect, it } from 'vitest';
import { HOLD_DURATION_MS } from '../chain/deadline';
import { HANDOFF_RESOLUTION, PHOTO_RESOLUTION, toCell } from '../geo';
import { CODE_TTL_MS, ChainError, Chains, type PhotoInput } from './chains';
import { openDb } from './db';

const t0 = new Date('2026-11-01T12:00:00Z');
const at = (ms: number) => new Date(t0.getTime() + ms);

const here = toCell(47.6235, -122.3195, HANDOFF_RESOLUTION);
const acrossTown = toCell(47.608, -122.3352, HANDOFF_RESOLUTION);

const photo: PhotoInput = {
	file: 'a.jpg',
	caption: 'hi from the hill',
	cell: toCell(47.6235, -122.3195, PHOTO_RESOLUTION),
	place: {
		neighbourhood: 'Capitol Hill',
		city: 'Seattle',
		region: 'Washington',
		country: 'United States'
	}
};

function expectChainError(fn: () => unknown, code: string) {
	expect(fn).toThrow(ChainError);
	try {
		fn();
	} catch (error) {
		expect((error as ChainError).code).toBe(code);
	}
}

let chains: Chains;
beforeEach(() => {
	chains = new Chains(openDb(':memory:'));
});

describe('start', () => {
	it('makes the starter holder #1 of a new chain', () => {
		const { chainId, token } = chains.start(t0);
		const holder = chains.holderByToken(token);
		expect(holder).toMatchObject({ chainId, position: 1, passedAt: null });
		expect(chains.current(chainId)?.id).toBe(holder?.id);
	});

	it('never stores the raw token', () => {
		const { token } = chains.start(t0);
		expect(chains.holderByToken(token + 'x')).toBeUndefined();
	});
});

describe('photos', () => {
	it('saves one photo per holder and replaces it on retake', () => {
		const { token } = chains.start(t0);
		chains.savePhoto(token, photo, at(1000));
		chains.savePhoto(token, { ...photo, file: 'b.jpg' }, at(2000));
		const holder = chains.holderByToken(token)!;
		expect(chains.photoOf(holder.id)).toMatchObject({ file: 'b.jpg', caption: 'hi from the hill' });
	});

	it('updates just the caption', () => {
		const { token } = chains.start(t0);
		chains.savePhoto(token, photo, t0);
		chains.setCaption(token, 'new words', t0);
		expect(chains.photoOf(chains.holderByToken(token)!.id)?.caption).toBe('new words');
	});

	it('rejects a precise cell, so a home can never be stored', () => {
		const { token } = chains.start(t0);
		expectChainError(() => chains.savePhoto(token, { ...photo, cell: here }, t0), 'bad_cell');
	});
});

describe('handoff', () => {
	function holderWithPhoto() {
		const started = chains.start(t0);
		chains.savePhoto(started.token, photo, t0);
		return started;
	}

	it('needs a photo before the camera can be passed on', () => {
		const { token } = chains.start(t0);
		expectChainError(() => chains.issueCode(token, here, t0), 'no_photo');
	});

	it('passes the camera when both phones are together', () => {
		const giver = holderWithPhoto();
		const code = chains.issueCode(giver.token, here, at(1000));
		const received = chains.accept(code, here, at(3000));

		expect(received).toMatchObject({ chainId: giver.chainId, position: 2 });
		expect(chains.holderByToken(giver.token)?.passedAt).toEqual(at(3000));
		expect(chains.current(giver.chainId)?.position).toBe(2);
		expect(chains.handoffState(giver.token).passed).toBe(true);
		expect(chains.codeStatus(code, at(3000)).status).toBe('used');
	});

	it('refuses when the phones are not together', () => {
		const giver = holderWithPhoto();
		const code = chains.issueCode(giver.token, here, t0);
		expectChainError(() => chains.accept(code, acrossTown, at(1000)), 'not_together');
		expect(chains.current(giver.chainId)?.position).toBe(1);
	});

	it('refuses a code older than its time to live', () => {
		const giver = holderWithPhoto();
		const code = chains.issueCode(giver.token, here, t0);
		expect(chains.codeStatus(code, at(CODE_TTL_MS + 1)).status).toBe('expired');
		expectChainError(() => chains.accept(code, here, at(CODE_TTL_MS + 1)), 'code_expired');
	});

	it('refuses a code once it has been used', () => {
		const giver = holderWithPhoto();
		const code = chains.issueCode(giver.token, here, t0);
		chains.accept(code, here, at(1000));
		expectChainError(() => chains.accept(code, here, at(2000)), 'code_closed');
	});

	it('does not let the holder receive their own camera', () => {
		const giver = holderWithPhoto();
		const code = chains.issueCode(giver.token, here, t0);
		expectChainError(() => chains.accept(code, here, at(1000), giver.token), 'own_code');
	});

	it('stops a passed-on holder from issuing more codes or retaking', () => {
		const giver = holderWithPhoto();
		chains.accept(chains.issueCode(giver.token, here, t0), here, at(1000));
		expectChainError(() => chains.issueCode(giver.token, here, at(2000)), 'already_passed');
		expectChainError(() => chains.savePhoto(giver.token, photo, at(2000)), 'already_passed');
	});

	it('records a decline and leaves the camera with the giver', () => {
		const giver = holderWithPhoto();
		const code = chains.issueCode(giver.token, here, at(1000));
		chains.decline(code, at(2000));

		expect(chains.codeStatus(code, at(2000)).status).toBe('declined');
		expect(chains.handoffState(giver.token)).toEqual({ passed: false, lastDeclinedAt: at(1000) });
		expect(chains.current(giver.chainId)?.position).toBe(1);
	});

	it('clears stored handoff cells once a code is used or declined', () => {
		const db = openDb(':memory:');
		chains = new Chains(db);
		const giver = holderWithPhoto();
		chains.decline(chains.issueCode(giver.token, here, t0), t0);
		chains.accept(chains.issueCode(giver.token, here, t0), here, t0);
		const cells = db.prepare("SELECT cell FROM handoff_codes WHERE cell != ''").all();
		expect(cells).toEqual([]);
	});
});

describe('ending', () => {
	it('ends the chain when the holder runs out of time', () => {
		const { chainId, token } = chains.start(t0);
		expect(chains.endedAt(chainId, at(HOLD_DURATION_MS - 1))).toBeNull();
		expect(chains.endedAt(chainId, at(HOLD_DURATION_MS))).toEqual(at(HOLD_DURATION_MS));
		expectChainError(() => chains.savePhoto(token, photo, at(HOLD_DURATION_MS)), 'chain_ended');
	});

	it('gives the new holder a fresh seven days', () => {
		const giver = chains.start(t0);
		chains.savePhoto(giver.token, photo, t0);
		const handedAt = at(HOLD_DURATION_MS - 1000);
		chains.accept(chains.issueCode(giver.token, here, handedAt), here, handedAt);
		expect(chains.endedAt(giver.chainId, at(HOLD_DURATION_MS + 1000))).toBeNull();
	});
});

describe('photos of a chain', () => {
	it('lists photos in holder order with positions', () => {
		const giver = chains.start(t0);
		chains.savePhoto(giver.token, photo, t0);
		const next = chains.accept(chains.issueCode(giver.token, here, t0), here, t0);
		chains.savePhoto(next.token, { ...photo, file: 'second.jpg' }, at(1000));
		expect(chains.photos(giver.chainId).map((p) => [p.position, p.file])).toEqual([
			[1, 'a.jpg'],
			[2, 'second.jpg']
		]);
	});
});

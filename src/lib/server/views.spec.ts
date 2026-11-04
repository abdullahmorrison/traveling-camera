import { beforeEach, describe, expect, it } from 'vitest';
import { HOLD_DURATION_MS } from '../chain/deadline';
import { HANDOFF_RESOLUTION, PHOTO_RESOLUTION, toCell } from '../geo';
import { Chains } from './chains';
import { openDb } from './db';
import { chainView } from './views';

const t0 = new Date('2026-11-01T12:00:00Z');
const here = toCell(47.6235, -122.3195, HANDOFF_RESOLUTION);
const photo = {
	file: 'a.jpg',
	caption: '',
	cell: toCell(47.6235, -122.3195, PHOTO_RESOLUTION),
	place: { neighbourhood: 'Capitol Hill', city: 'Seattle', region: null, country: null }
};

let chains: Chains;
beforeEach(() => {
	chains = new Chains(openDb(':memory:'));
});

describe('chainView', () => {
	it('returns null for a chain that does not exist', () => {
		expect(chainView(chains, 99, null, t0)).toBeNull();
	});

	it('shows the holder their own state', () => {
		const { chainId, token } = chains.start(t0);
		expect(chainView(chains, chainId, token, t0)).toMatchObject({
			role: 'holder',
			isMine: true,
			holderCount: 1,
			msLeft: HOLD_DURATION_MS,
			myPhoto: null
		});
		chains.savePhoto(token, photo, t0);
		expect(chainView(chains, chainId, token, t0)?.myPhoto?.url).toBe('/photos/a.jpg');
	});

	it('turns the previous holder into a follower after passing', () => {
		const giver = chains.start(t0);
		chains.savePhoto(giver.token, photo, t0);
		const next = chains.accept(chains.issueCode(giver.token, here, t0), here, t0);
		expect(chainView(chains, giver.chainId, giver.token, t0)?.role).toBe('follower');
		expect(chainView(chains, giver.chainId, next.token, t0)?.role).toBe('holder');
		expect(chainView(chains, giver.chainId, null, t0)?.holderCount).toBe(2);
	});

	it('marks the chain ended once time runs out', () => {
		const { chainId, token } = chains.start(t0);
		const later = new Date(t0.getTime() + HOLD_DURATION_MS);
		expect(chainView(chains, chainId, token, later)).toMatchObject({
			role: 'ended',
			isMine: true,
			msLeft: 0
		});
	});
});

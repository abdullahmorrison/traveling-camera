import { timeLeft } from '../chain/deadline';
import { distanceKm } from '../chain/trail';
import type { Chains, Place } from './chains';

export type Role = 'holder' | 'follower' | 'ended';

export interface PhotoView {
	position: number;
	url: string;
	caption: string;
	place: Place;
	cell: string;
	takenAt: string;
}

export interface ChainView {
	id: number;
	startedAt: string;
	holderCount: number;
	/** Position of whoever has (or last had) the camera. */
	currentPosition: number;
	km: number;
	role: Role;
	/** Whether this device is (or was, if the chain ended) the last holder. */
	isMine: boolean;
	msLeft: number;
	myPhoto: PhotoView | null;
	photos: PhotoView[];
}

export const photoUrl = (file: string) => `/photos/${file}`;

/** Everything a chain page needs, from the point of view of the device holding `token`. */
export function chainView(
	chains: Chains,
	chainId: number,
	token: string | null,
	now: Date
): ChainView | null {
	const current = chains.current(chainId);
	if (!current) return null;
	const holders = chains.holders(chainId);
	const me = token ? chains.holderByToken(token) : undefined;
	const isMine = me?.id === current.id;
	const ended = chains.endedAt(chainId, now) !== null;

	const photos: PhotoView[] = chains.photos(chainId).map((photo) => ({
		position: photo.position,
		url: photoUrl(photo.file),
		caption: photo.caption,
		place: photo.place,
		cell: photo.cell,
		takenAt: photo.takenAt.toISOString()
	}));

	return {
		id: chainId,
		startedAt: holders[0]!.receivedAt.toISOString(),
		holderCount: holders.length,
		currentPosition: current.position,
		km: Math.round(distanceKm(photos)),
		role: ended ? 'ended' : isMine ? 'holder' : 'follower',
		isMine,
		msLeft: timeLeft(current.receivedAt, now),
		myPhoto: isMine ? (photos.find((p) => p.position === current.position) ?? null) : null,
		photos
	};
}

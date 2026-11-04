import { HOLD_DURATION_MS } from '../chain/deadline';
import { HANDOFF_RESOLUTION, PHOTO_RESOLUTION, areTogether, isCellAt } from '../geo';
import { transaction, type Db } from './db';
import { hashToken, newHandoffCode, newHolderToken } from './tokens';

/** A shown QR code stops working after this long. The holder's screen rotates it well before. */
export const CODE_TTL_MS = 15_000;
/** Handoff rows (and the cells in them) older than this are deleted. */
const CODE_RETENTION_MS = 60_000;

export type ChainErrorCode =
	| 'not_holder'
	| 'already_passed'
	| 'chain_ended'
	| 'no_photo'
	| 'bad_cell'
	| 'code_unknown'
	| 'code_expired'
	| 'code_closed'
	| 'own_code'
	| 'not_together';

export class ChainError extends Error {
	constructor(readonly code: ChainErrorCode) {
		super(code);
		this.name = 'ChainError';
	}
}

export interface Holder {
	id: number;
	chainId: number;
	position: number;
	receivedAt: Date;
	passedAt: Date | null;
}

export interface Place {
	neighbourhood: string | null;
	city: string | null;
	region: string | null;
	country: string | null;
}

export interface PhotoInput {
	file: string;
	caption: string;
	/** H3 cell at PHOTO_RESOLUTION. */
	cell: string;
	place: Place;
}

export interface Photo extends PhotoInput {
	holderId: number;
	takenAt: Date;
}

export type CodeStatus = 'open' | 'expired' | 'used' | 'declined' | 'unknown';

interface HolderRow {
	id: number;
	chain_id: number;
	position: number;
	received_at: number;
	passed_at: number | null;
}

interface PhotoRow {
	holder_id: number;
	file: string;
	caption: string;
	cell: string;
	neighbourhood: string | null;
	city: string | null;
	region: string | null;
	country: string | null;
	taken_at: number;
}

interface CodeRow {
	code: string;
	holder_id: number;
	cell: string;
	created_at: number;
	status: 'open' | 'declined' | 'used';
}

const toHolder = (row: HolderRow): Holder => ({
	id: row.id,
	chainId: row.chain_id,
	position: row.position,
	receivedAt: new Date(row.received_at),
	passedAt: row.passed_at === null ? null : new Date(row.passed_at)
});

const toPhoto = (row: PhotoRow): Photo => ({
	holderId: row.holder_id,
	file: row.file,
	caption: row.caption,
	cell: row.cell,
	place: {
		neighbourhood: row.neighbourhood,
		city: row.city,
		region: row.region,
		country: row.country
	},
	takenAt: new Date(row.taken_at)
});

/** Chain rules: who holds the camera, photos, and in-person handoffs. Time is always passed in. */
export class Chains {
	constructor(private readonly db: Db) {}

	/** Starts a new chain. The caller becomes holder #1. */
	start(now: Date): { chainId: number; token: string } {
		return transaction(this.db, () => {
			const { id: chainId } = this.db
				.prepare('INSERT INTO chains (started_at) VALUES (?) RETURNING id')
				.get(now.getTime()) as { id: number };
			const token = this.insertHolder(chainId, 1, now);
			return { chainId, token };
		});
	}

	holderByToken(token: string): Holder | undefined {
		const row = this.db
			.prepare('SELECT * FROM holders WHERE token_hash = ?')
			.get(hashToken(token)) as HolderRow | undefined;
		return row && toHolder(row);
	}

	holders(chainId: number): Holder[] {
		const rows = this.db
			.prepare('SELECT * FROM holders WHERE chain_id = ? ORDER BY position')
			.all(chainId) as unknown as HolderRow[];
		return rows.map(toHolder);
	}

	/** The holder with the camera now, or the last holder if the chain ended. */
	current(chainId: number): Holder | undefined {
		const row = this.db
			.prepare('SELECT * FROM holders WHERE chain_id = ? ORDER BY position DESC LIMIT 1')
			.get(chainId) as HolderRow | undefined;
		return row && toHolder(row);
	}

	/** A chain ends when its current holder runs out of time. */
	endedAt(chainId: number, now: Date): Date | null {
		const holder = this.current(chainId);
		if (!holder) return null;
		const deadline = holder.receivedAt.getTime() + HOLD_DURATION_MS;
		return now.getTime() >= deadline ? new Date(deadline) : null;
	}

	/** Saves the holder's photo. Retaking replaces it until the camera is passed on. */
	savePhoto(token: string, input: PhotoInput, now: Date): void {
		const holder = this.requireActiveHolder(token, now);
		if (!isCellAt(input.cell, PHOTO_RESOLUTION)) throw new ChainError('bad_cell');
		const { place } = input;
		this.db
			.prepare(
				`INSERT INTO photos (holder_id, file, caption, cell, neighbourhood, city, region, country, taken_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
				 ON CONFLICT (holder_id) DO UPDATE SET
					file = excluded.file, caption = excluded.caption, cell = excluded.cell,
					neighbourhood = excluded.neighbourhood, city = excluded.city,
					region = excluded.region, country = excluded.country, taken_at = excluded.taken_at`
			)
			.run(
				holder.id,
				input.file,
				input.caption,
				input.cell,
				place.neighbourhood,
				place.city,
				place.region,
				place.country,
				now.getTime()
			);
	}

	/** Updates only the caption of the holder's existing photo. */
	setCaption(token: string, caption: string, now: Date): void {
		const holder = this.requireActiveHolder(token, now);
		const result = this.db
			.prepare('UPDATE photos SET caption = ? WHERE holder_id = ?')
			.run(caption, holder.id);
		if (result.changes === 0) throw new ChainError('no_photo');
	}

	photoOf(holderId: number): Photo | undefined {
		const row = this.db.prepare('SELECT * FROM photos WHERE holder_id = ?').get(holderId) as
			PhotoRow | undefined;
		return row && toPhoto(row);
	}

	/** Photos of a chain in holder order, with each holder's position. */
	photos(chainId: number): (Photo & { position: number })[] {
		const rows = this.db
			.prepare(
				`SELECT photos.*, holders.position FROM photos
				 JOIN holders ON holders.id = photos.holder_id
				 WHERE holders.chain_id = ? ORDER BY holders.position`
			)
			.all(chainId) as unknown as (PhotoRow & { position: number })[];
		return rows.map((row) => ({ ...toPhoto(row), position: row.position }));
	}

	/**
	 * Issues a fresh handoff code for the holder's QR. `cell` is the holder's
	 * HANDOFF_RESOLUTION cell; it is kept only until the code is used or expires.
	 */
	issueCode(token: string, cell: string, now: Date): string {
		const holder = this.requireActiveHolder(token, now);
		if (!this.photoOf(holder.id)) throw new ChainError('no_photo');
		if (!isCellAt(cell, HANDOFF_RESOLUTION)) throw new ChainError('bad_cell');
		this.db
			.prepare('DELETE FROM handoff_codes WHERE created_at < ?')
			.run(now.getTime() - CODE_RETENTION_MS);
		const code = newHandoffCode();
		this.db
			.prepare('INSERT INTO handoff_codes (code, holder_id, cell, created_at) VALUES (?, ?, ?, ?)')
			.run(code, holder.id, cell, now.getTime());
		return code;
	}

	codeStatus(code: string, now: Date): { status: CodeStatus; chainId?: number } {
		const row = this.codeRow(code);
		if (!row) return { status: 'unknown' };
		const holder = this.holderById(row.holder_id);
		const chainId = holder.chainId;
		if (row.status !== 'open') return { status: row.status, chainId };
		if (this.isExpired(row, now) || holder.passedAt || this.endedAt(chainId, now)) {
			return { status: 'expired', chainId };
		}
		return { status: 'open', chainId };
	}

	/**
	 * The receiver accepts the camera. Succeeds only if the code is fresh and
	 * both phones are in the same or touching cells. Returns the new holder's token.
	 */
	accept(
		code: string,
		receiverCell: string,
		now: Date,
		receiverToken?: string
	): { token: string; chainId: number; position: number } {
		return transaction(this.db, () => {
			const row = this.openCode(code, now);
			const giver = this.holderById(row.holder_id);
			if (receiverToken && this.holderByToken(receiverToken)?.id === giver.id) {
				throw new ChainError('own_code');
			}
			if (!areTogether(row.cell, receiverCell)) throw new ChainError('not_together');

			this.db.prepare('UPDATE holders SET passed_at = ? WHERE id = ?').run(now.getTime(), giver.id);
			this.db
				.prepare(
					"UPDATE handoff_codes SET status = 'used', cell = '' WHERE holder_id = ? AND status = 'open'"
				)
				.run(giver.id);
			const position = giver.position + 1;
			const token = this.insertHolder(giver.chainId, position, now);
			return { token, chainId: giver.chainId, position };
		});
	}

	/** The person asked said no. The giver keeps the camera. */
	decline(code: string, now: Date): void {
		const row = this.openCode(code, now);
		this.db
			.prepare("UPDATE handoff_codes SET status = 'declined', cell = '' WHERE code = ?")
			.run(row.code);
	}

	/** What the giver's screen needs while showing codes. */
	handoffState(token: string): { passed: boolean; lastDeclinedAt: Date | null } {
		const holder = this.holderByToken(token);
		if (!holder) throw new ChainError('not_holder');
		const declined = this.db
			.prepare(
				"SELECT MAX(created_at) AS at FROM handoff_codes WHERE holder_id = ? AND status = 'declined'"
			)
			.get(holder.id) as { at: number | null };
		return {
			passed: holder.passedAt !== null,
			lastDeclinedAt: declined.at === null ? null : new Date(declined.at)
		};
	}

	private insertHolder(chainId: number, position: number, now: Date): string {
		const token = newHolderToken();
		this.db
			.prepare(
				'INSERT INTO holders (chain_id, position, token_hash, received_at) VALUES (?, ?, ?, ?)'
			)
			.run(chainId, position, hashToken(token), now.getTime());
		return token;
	}

	private holderById(id: number): Holder {
		const row = this.db.prepare('SELECT * FROM holders WHERE id = ?').get(id) as
			HolderRow | undefined;
		if (!row) throw new Error(`holder ${id} missing`);
		return toHolder(row);
	}

	private requireActiveHolder(token: string, now: Date): Holder {
		const holder = this.holderByToken(token);
		if (!holder) throw new ChainError('not_holder');
		if (holder.passedAt) throw new ChainError('already_passed');
		if (this.endedAt(holder.chainId, now)) throw new ChainError('chain_ended');
		return holder;
	}

	private codeRow(code: string): CodeRow | undefined {
		return this.db.prepare('SELECT * FROM handoff_codes WHERE code = ?').get(code) as
			CodeRow | undefined;
	}

	private isExpired(row: CodeRow, now: Date): boolean {
		return now.getTime() - row.created_at > CODE_TTL_MS;
	}

	private openCode(code: string, now: Date): CodeRow {
		const row = this.codeRow(code);
		if (!row) throw new ChainError('code_unknown');
		if (row.status !== 'open') throw new ChainError('code_closed');
		const giver = this.holderById(row.holder_id);
		if (giver.passedAt) throw new ChainError('code_closed');
		if (this.isExpired(row, now) || this.endedAt(giver.chainId, now)) {
			throw new ChainError('code_expired');
		}
		return row;
	}
}

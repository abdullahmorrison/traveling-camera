import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

/** Append-only. Each entry runs once, in order, tracked by `PRAGMA user_version`. */
const MIGRATIONS = [
	`
	CREATE TABLE chains (
		id INTEGER PRIMARY KEY,
		started_at INTEGER NOT NULL
	);

	CREATE TABLE holders (
		id INTEGER PRIMARY KEY,
		chain_id INTEGER NOT NULL REFERENCES chains(id),
		position INTEGER NOT NULL,
		token_hash TEXT NOT NULL UNIQUE,
		received_at INTEGER NOT NULL,
		passed_at INTEGER,
		UNIQUE (chain_id, position)
	);

	CREATE TABLE photos (
		holder_id INTEGER PRIMARY KEY REFERENCES holders(id),
		file TEXT NOT NULL,
		caption TEXT NOT NULL DEFAULT '',
		cell TEXT NOT NULL,
		neighbourhood TEXT,
		city TEXT,
		region TEXT,
		country TEXT,
		taken_at INTEGER NOT NULL
	);

	CREATE TABLE handoff_codes (
		code TEXT PRIMARY KEY,
		holder_id INTEGER NOT NULL REFERENCES holders(id),
		cell TEXT NOT NULL,
		created_at INTEGER NOT NULL,
		status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'declined', 'used'))
	);

	CREATE INDEX handoff_codes_by_holder ON handoff_codes (holder_id, created_at);
	`
];

export function openDb(path: string): Db {
	if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
	const db = new DatabaseSync(path);
	db.exec('PRAGMA foreign_keys = ON');
	if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL');
	migrate(db);
	return db;
}

function migrate(db: Db): void {
	const { user_version: current } = db.prepare('PRAGMA user_version').get() as {
		user_version: number;
	};
	for (let version = current; version < MIGRATIONS.length; version++) {
		transaction(db, () => {
			db.exec(MIGRATIONS[version]!);
			db.exec(`PRAGMA user_version = ${version + 1}`);
		});
	}
}

export function transaction<T>(db: Db, work: () => T): T {
	db.exec('BEGIN');
	try {
		const result = work();
		db.exec('COMMIT');
		return result;
	} catch (error) {
		db.exec('ROLLBACK');
		throw error;
	}
}

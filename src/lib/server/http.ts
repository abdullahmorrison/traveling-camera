import { error } from '@sveltejs/kit';
import { ChainError } from './chains';

/** Runs chain logic, turning rule violations into 409s that carry the rule's code. */
export function rule<T>(work: () => T): T {
	try {
		return work();
	} catch (cause) {
		if (cause instanceof ChainError) error(409, cause.code);
		throw cause;
	}
}

export async function readJson<T extends object>(request: Request): Promise<Partial<T>> {
	try {
		const body: unknown = await request.json();
		return body && typeof body === 'object' ? (body as Partial<T>) : {};
	} catch {
		error(400, 'Expected JSON');
	}
}

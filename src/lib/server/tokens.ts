import { createHash, randomBytes } from 'node:crypto';

/** Secret held in the holder's cookie. Only its hash is stored. */
export function newHolderToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

/** Short-lived code shown as a QR to the next holder. */
export function newHandoffCode(): string {
	return randomBytes(12).toString('base64url');
}

/** How long a holder has to pass the camera on before the chain ends. */
export const HOLD_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/** The moment the chain ends if the camera received at `receivedAt` is not passed on. */
export function passDeadline(receivedAt: Date): Date {
	return new Date(receivedAt.getTime() + HOLD_DURATION_MS);
}

/** Milliseconds left to pass the camera on, never negative. */
export function timeLeft(receivedAt: Date, now: Date): number {
	return Math.max(0, passDeadline(receivedAt).getTime() - now.getTime());
}

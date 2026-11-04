import { describe, expect, it } from 'vitest';
import { HOLD_DURATION_MS, passDeadline, timeLeft } from './deadline';

const receivedAt = new Date('2026-11-01T12:00:00Z');

describe('passDeadline', () => {
	it('is seven days after the camera was received', () => {
		expect(passDeadline(receivedAt).toISOString()).toBe('2026-11-08T12:00:00.000Z');
	});
});

describe('timeLeft', () => {
	it('counts down from the full hold duration', () => {
		expect(timeLeft(receivedAt, receivedAt)).toBe(HOLD_DURATION_MS);
	});

	it('never goes below zero after the deadline', () => {
		expect(timeLeft(receivedAt, new Date('2026-11-09T00:00:00Z'))).toBe(0);
	});
});

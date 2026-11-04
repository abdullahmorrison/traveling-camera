import { describe, expect, it } from 'vitest';
import { reminderIcs } from './calendar';

describe('reminderIcs', () => {
	const deadline = new Date('2026-11-08T12:00:00Z');

	it('reminds a day before the deadline', () => {
		const ics = reminderIcs(
			1,
			deadline,
			'https://travelingcamera.app/c/1',
			new Date('2026-11-02T00:00:00Z')
		);
		expect(ics).toContain('DTSTART:20261107T120000Z');
		expect(ics).toContain('SUMMARY:Pass the camera on');
		expect(ics).toContain('URL:https://travelingcamera.app/c/1');
		expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
	});

	it('never schedules the reminder in the past', () => {
		const ics = reminderIcs(1, deadline, 'x', new Date('2026-11-08T06:00:00Z'));
		expect(ics).toContain('DTSTART:20261108T060000Z');
	});
});

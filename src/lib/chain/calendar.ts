const pad = (n: number) => String(n).padStart(2, '0');

function icsDate(date: Date): string {
	return (
		`${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
		`T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
	);
}

/** A one-event calendar file reminding the holder a day before the chain would end. */
export function reminderIcs(chainId: number, deadline: Date, chainUrl: string, now: Date): string {
	const start = new Date(Math.max(now.getTime(), deadline.getTime() - 24 * 60 * 60 * 1000));
	const end = new Date(start.getTime() + 30 * 60 * 1000);
	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Traveling Camera//EN',
		'BEGIN:VEVENT',
		`UID:chain-${chainId}-${deadline.getTime()}@travelingcamera.app`,
		`DTSTAMP:${icsDate(now)}`,
		`DTSTART:${icsDate(start)}`,
		`DTEND:${icsDate(end)}`,
		'SUMMARY:Pass the camera on',
		`DESCRIPTION:The chain ends if it isn't passed on by ${deadline.toUTCString()}.`,
		`URL:${chainUrl}`,
		'BEGIN:VALARM',
		'TRIGGER:PT0M',
		'ACTION:DISPLAY',
		'DESCRIPTION:Pass the camera on',
		'END:VALARM',
		'END:VEVENT',
		'END:VCALENDAR',
		''
	].join('\r\n');
}

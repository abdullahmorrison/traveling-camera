import { devices, expect, type Browser, type Page } from '@playwright/test';

export const capitolHill = { latitude: 47.6235, longitude: -122.3195 };
export const acrossTheStreet = { latitude: 47.6237, longitude: -122.3193 };
export const downtown = { latitude: 47.608, longitude: -122.3352 };

/** A phone at `place` that has granted camera and location. */
export async function phone(browser: Browser, place: { latitude: number; longitude: number }) {
	const context = await browser.newContext({
		...devices['Pixel 7'],
		geolocation: place,
		permissions: ['camera', 'geolocation']
	});
	return context.newPage();
}

export async function startChain(page: Page): Promise<string> {
	await page.goto('/admin');
	await page.getByRole('button', { name: 'Start a chain' }).click();
	await expect(page).toHaveURL(/\/c\/\d+$/);
	return new URL(page.url()).pathname;
}

export async function takePhoto(page: Page, caption = '') {
	await page.getByRole('link', { name: 'Take your photo' }).click();
	await page.waitForFunction(() => (document.querySelector('video')?.videoWidth ?? 0) > 0);
	await page.getByRole('button', { name: 'Take photo' }).click();
	if (caption) await page.getByLabel('Caption').fill(caption);
	await page.getByRole('button', { name: 'Use this photo' }).click();
	await expect(page.getByText('Your photo is in')).toBeVisible();
}

/** Opens the QR screen and returns the code currently shown. */
export async function showCode(page: Page): Promise<string> {
	await page.getByRole('link', { name: 'Pass it on' }).click();
	const qr = page.locator('[data-code]');
	await expect(qr).toBeVisible();
	return (await qr.getAttribute('data-code'))!;
}

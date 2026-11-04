import { expect, test } from '@playwright/test';
import { capitolHill, phone, startChain, takePhoto } from './helpers';

test('the chain map pins photos and switches zoom levels', async ({ browser }) => {
	const holder = await phone(browser, capitolHill);
	await startChain(holder);
	await takePhoto(holder);

	const pin = holder.getByRole('button', { name: /1 photo$/ });
	await expect(pin).toBeVisible();
	await expect(holder.getByRole('radio', { name: 'neighbourhood' })).toBeChecked();
	await holder.getByRole('radio', { name: 'world' }).click();
	await expect(holder.getByRole('radio', { name: 'world' })).toBeChecked();
	await expect(pin).toBeVisible();
});

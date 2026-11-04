import { expect, test } from '@playwright/test';
import {
	acrossTheStreet,
	capitolHill,
	downtown,
	phone,
	showCode,
	startChain,
	takePhoto
} from './helpers';

test('the camera passes in person from one phone to another', async ({ browser }) => {
	const giver = await phone(browser, capitolHill);
	const chainPath = await startChain(giver);
	await expect(giver.getByRole('heading', { name: 'You have the camera' })).toBeVisible();
	await expect(giver.getByText('No photo yet')).toBeVisible();

	await takePhoto(giver, 'first stop');
	const code = await showCode(giver);

	const receiver = await phone(browser, acrossTheStreet);
	await receiver.goto(`/h/${code}`);
	await expect(
		receiver.getByRole('heading', { name: 'Only you can continue the chain' })
	).toBeVisible();
	await expect(receiver.getByText("You're #2.")).toBeVisible();
	await receiver.getByRole('button', { name: 'Continue the chain' }).click();

	await expect(receiver).toHaveURL(new RegExp(`${chainPath}$`));
	await expect(receiver.getByRole('heading', { name: 'You have the camera' })).toBeVisible();
	await expect(receiver.getByText('No photo yet')).toBeVisible();

	// The giver's QR screen notices on its next refresh.
	await expect(giver.getByRole('heading', { name: 'Passed on' })).toBeVisible({ timeout: 10_000 });
	await expect(giver.getByText('You were #1')).toBeVisible();
	await giver.getByRole('link', { name: 'Follow the chain' }).click();
	await expect(giver.getByRole('heading', { name: 'On the move' })).toBeVisible();
});

test('saying no leaves the camera with the giver and tells them', async ({ browser }) => {
	const giver = await phone(browser, capitolHill);
	await startChain(giver);
	await takePhoto(giver);
	const code = await showCode(giver);

	const asked = await phone(browser, capitolHill);
	await asked.goto(`/h/${code}`);
	await asked.getByRole('button', { name: 'Not for me' }).click();
	await expect(asked.getByRole('heading', { name: 'Not this time' })).toBeVisible();

	await expect(giver.getByText('They passed on it. Ask someone else.')).toBeVisible({
		timeout: 10_000
	});
});

test('phones in different places can not hand the camera over', async ({ browser }) => {
	const giver = await phone(browser, capitolHill);
	await startChain(giver);
	await takePhoto(giver);
	const code = await showCode(giver);

	const remote = await phone(browser, downtown);
	await remote.goto(`/h/${code}`);
	await remote.getByRole('button', { name: 'Continue the chain' }).click();
	await expect(remote.getByRole('heading', { name: "Couldn't confirm" })).toBeVisible();
});

test('an unknown code shows an error', async ({ page }) => {
	const response = await page.goto('/h/not-a-real-code');
	expect(response?.status()).toBe(404);
});

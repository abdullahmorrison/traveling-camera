import { expect, test } from '@playwright/test';
import { acrossTheStreet, capitolHill, phone, showCode, startChain, takePhoto } from './helpers';

test('followers can browse the chain photo by photo', async ({ browser }) => {
	const giver = await phone(browser, capitolHill);
	const chainPath = await startChain(giver);
	await takePhoto(giver, 'hello from the hill');

	const reminder = giver.waitForEvent('download');
	await giver.getByRole('link', { name: 'Remind me before it ends' }).click();
	expect((await reminder).suggestedFilename()).toBe('pass-the-camera.ics');

	const code = await showCode(giver);
	const receiver = await phone(browser, acrossTheStreet);
	await receiver.goto(`/h/${code}`);
	await receiver.getByRole('button', { name: 'Continue the chain' }).click();
	await expect(receiver.getByRole('heading', { name: 'You have the camera' })).toBeVisible();

	await giver.goto(chainPath);
	await expect(giver.getByRole('heading', { name: 'On the move' })).toBeVisible();
	await giver.getByRole('list', { name: 'Recent stops' }).getByRole('link').first().click();
	await expect(giver.getByText('hello from the hill')).toBeVisible();
	await expect(giver.getByText('#1 of 2')).toBeVisible();

	await giver.getByRole('link', { name: 'Every photo' }).click();
	await expect(giver.getByRole('heading', { name: 'Every photo' })).toBeVisible();
	await expect(giver.getByRole('listitem')).toHaveCount(1);

	await giver.goto(chainPath);
	await giver.getByRole('button', { name: /1 photo$/ }).click();
	await expect(giver.getByRole('heading', { name: 'Somewhere' })).toBeVisible();
	await expect(giver.getByText('hello from the hill')).toBeVisible();
});

test('how this works explains the rules', async ({ page }) => {
	await page.goto('/how');
	await expect(page.getByRole('heading', { name: 'How this works' })).toBeVisible();
	await expect(page.getByText('You have 7 days.')).toBeVisible();
});

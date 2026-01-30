import { BrowserContext, expect, Page } from '@playwright/test';

import { DISABLE_EXPORT_MESSAGES } from '@/utils/constants';

export async function deleteAllMessages(page: Page) {
	let messageCount = await page.locator('.c-message_kit__message').count();
	while (messageCount > 0) {
		await deleteLastMessage(page);
		try {
			await expect(page.locator('.c-message_kit__message')).toHaveCount(messageCount - 1, { timeout: 1000 });
		} catch {
			break;
		}
		messageCount = await page.locator('.c-message_kit__message').count();
	}
}

export async function deleteLastMessage(page: Page) {
	// Open message context menu
	const lastMessage = page.locator('.c-message_kit__message').last();
	await lastMessage.hover();
	await page.locator('[data-qa="more_message_actions"]').click();

	// Click Delete
	await expect(page.locator('[data-qa="delete_message"]')).toBeVisible({ timeout: 3000 });
	await page.locator('[data-qa="delete_message"]').click();

	// Confirm Delete
	await expect(page.locator('[data-qa="dialog_go"]')).toBeVisible({ timeout: 3000 });
	await page.locator('[data-qa="dialog_go"]').click();
}

export async function getTestMessageLink(page: Page, context: BrowserContext): Promise<string> {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);

	// Open message context menu
	const lastMessage = page.locator('.c-message_kit__message').last();
	await lastMessage.hover();
	await page.locator('[data-qa="more_message_actions"]').click();

	// Click Copy Link
	await expect(page.locator('[data-qa="copy_link"]')).toBeVisible({ timeout: 3000 });
	await page.locator('[data-qa="copy_link"]').click();

	// Read the copied link from clipboard
	const link = await page.evaluate(() => navigator.clipboard.readText());
	return link;
}

export async function postMessageWithLink(page: Page, url = 'https://github.com/wxt-dev/wxt') {
	const urlWithTimestamp = `${url}?timestamp=${Date.now()}`;
	const messageInput = page.locator('[data-qa="message_input"]');
	await expect(messageInput).toBeVisible({ timeout: 10000 });
	await messageInput.click();
	await page.keyboard.insertText(urlWithTimestamp);
	await page.waitForTimeout(100);
	await page.keyboard.press('Enter');
	await page.waitForTimeout(100);

	await page.waitForTimeout(3000);
};

export async function openTestSlackChannel(page: Page, name: string) {
	const maxRetries = 2;
	let attempt = 0;
	let loaded = false;
	while (attempt < maxRetries && !loaded) {
		try {
			await page.goto('https://app.slack.com/client', {});
			await waitForChannelLoad(page);
			loaded = true;
		} catch (e) {
			attempt++;
			if (attempt >= maxRetries) throw e;
		}
	}
	const channelSelector = page.locator('div.p-channel_sidebar__channel').filter({ hasText: new RegExp(`^${name}$`) });
	await expect(channelSelector).toBeVisible({ timeout: 15000 });
	await channelSelector.click();
	await waitForChannelLoad(page);
}

/** Verifies the current page is a channel and that it is loaded */
export async function waitForChannelLoad(page: Page) {
	await expect(page.locator('[data-qa="inline_channel_entity__name"]').first()).toBeVisible({ timeout: 10000 });
}

/** Checks the usage count badge on the tutorial page for a specific feature, and that all others show 0 (no badge) */
export async function verifyUsageCount(
	context: BrowserContext,
	extensionId: string,
	expectedFeature: string,
	expectedCount: number,
) {
	const tutorialPage = await context.newPage();
	await tutorialPage.goto(`chrome-extension://${extensionId}/tutorial.html`);
	await tutorialPage.waitForLoadState('networkidle');

	// Wait a moment for storage to sync
	await tutorialPage.waitForTimeout(500);

	// Define all trackable features
	const allFeatures = ['remove_embeds', 'auto_confirm_embed_removal', 'open_slack_links_in_browser', ...(DISABLE_EXPORT_MESSAGES ? [] : ['message_export_format']), 'pr_message'];

	for (const feature of allFeatures) {
		const badgeSelector = `[data-qa="usage-badge-${feature}"]`;
		if (feature === expectedFeature && expectedCount > 0) {
			// This feature should have the badge with correct count
			const badge = tutorialPage.locator(badgeSelector);
			await expect(badge).toBeVisible({ timeout: 5000 });
			await expect(badge).toHaveText(`Used ${expectedCount} ${expectedCount === 1 ? 'time' : 'times'}`, { timeout: 10000 });
		} else {
			// Other features should have no badge (count is 0)
			const badge = tutorialPage.locator(badgeSelector);
			await expect(badge).toBeHidden();
		}
	}

	await tutorialPage.close();
}

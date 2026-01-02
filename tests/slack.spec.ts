import { expect, test } from './fixtures';

test('toggle settings button visibility', async ({ context, page, extensionId }) => {
	await page.goto('https://app.slack.com/client');

	// Open tests channel
	const channelSelector = 'div.p-channel_sidebar__channel:has-text("tests")';
	await expect(page.locator(channelSelector)).toBeVisible({ timeout: 15000 });
	await page.locator(channelSelector).click();

	// Verify slacky settings button is visible
	const settingsButton = page.locator('[data-qa="slacky-settings-button"]');
	await expect(settingsButton).toBeVisible({ timeout: 15000 });

	// Open popup in a new tab to update settings
	const popupPage = await context.newPage();
	await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

	// Find and uncheck "Show settings button in Slack"
	const checkbox = popupPage.getByLabel('Show settings button in Slack');
	await expect(checkbox).toBeChecked();
	await checkbox.uncheck();
	await expect(checkbox).not.toBeChecked();

	// Verify the button disappeared on the original Slack page (live reactivity via storage sync)
	await expect(settingsButton).toBeHidden({ timeout: 5000 });

	// Clean up: re-enable the setting for other tests
	// await checkbox.check();
	// await expect(settingsButton).toBeVisible({ timeout: 5000 });
	// await popupPage.close();
});

/**
 * Test List TODO
 * - toggle settings button visibility
 * - toggle "always open slack links in browser"
 * - toggle remove all embed links
 * - toggle auto confirm embed removal
 * - all message export formats
 * - some different embed link filters
 */

import { expect, test } from './fixtures';
import { deleteAllMessages, deleteLastMessage, getTestMessageLink, openTestSlackChannel, postMessageWithLink, verifyUsageCount, waitForChannelLoad } from './test-utils';

/**
 * Tests each feature. Features that track usage counts run twice to verify the count is incremented in the tutorial page.
 * Each test uses a separate Slack channel so they can run in parallel.
 *
 * Features:
 * - remove_embed_link_mode
 * - embed_link_filters
 * - auto_confirm_embed_removal
 * - open_slack_links_in_browser
 * - message_export_format
 * - show_settings_button_in_slack
 */

// =============================================================================
// Test: show_settings_button_in_slack
// Always works
// =============================================================================
test('show_settings_button_in_slack: toggle visibility', async ({ context, page, extensionId }) => {
	// Open Slack
	await page.goto('https://app.slack.com/client');
	await waitForChannelLoad(page);

	// Verify slacky settings button is visible by default
	const settingsButton = page.locator('[data-qa="slacky-settings-button"]');
	await expect(settingsButton).toBeVisible({ timeout: 15000 });

	// Open options page to update settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Find and uncheck "Show settings button in Slack"
	const checkbox = optionsPage.locator('[data-qa="setting-show-settings-button"]');
	await expect(checkbox).toBeChecked();

	// DISABLED: Uncheck the setting
	await checkbox.uncheck();
	await expect(checkbox).not.toBeChecked();

	// Verify the button disappeared on the original Slack page
	await expect(settingsButton).toBeHidden({ timeout: 5000 });

	await optionsPage.close();
});

// =============================================================================
// Test: remove_embed_link_mode
// Headless 9/10 - works unless slack attachment removing failed
// =============================================================================
test('remove_embed_link_mode: toggle embed removal', async ({ context, page, extensionId }) => {
	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Ensure embed mode is set to "off" initially (test manual removal)
	const segmentedControl = optionsPage.locator('[data-qa="setting-remove-embeds-control"]');
	await expect(segmentedControl).toBeVisible();

	// Go to Slack and open tests channel
	await openTestSlackChannel(page, 'test-1');
	await deleteAllMessages(page);

	// DISABLED STATE: Post a message with link, verify embed appears
	await postMessageWithLink(page);

	// Verify the embed/attachment appears (since setting is disabled)
	const attachment = page.locator('.c-message_attachment').last();
	await expect(attachment).toBeVisible({ timeout: 10000 });

	// Delete the last message
	await deleteLastMessage(page);
	// Verify the attachment is gone before continuing
	await expect(page.locator('.c-message_attachment')).toHaveCount(0, { timeout: 5000 });

	// ENABLED STATE: Enable the setting by clicking "Remove all"
	await optionsPage.bringToFront();
	const removeAllOption = segmentedControl.locator('label:has-text("Remove all")');
	await removeAllOption.click();
	await optionsPage.waitForTimeout(500);

	// Wait for settings to propagate to content script, then bring Slack to front
	// await page.waitForTimeout(1000);
	await page.bringToFront();

	// Post another message with link - Run #1
	await postMessageWithLink(page);

	// Run #2 - post another message to trigger the feature again
	await postMessageWithLink(page);

	// Ensure 0 attachments (extension should have removed them)
	await expect(page.locator('.c-message_attachment')).toHaveCount(0, { timeout: 10000 });

	// Verify usage count shows "Used 2 times" on tutorial page
	await verifyUsageCount(context, extensionId, 'remove_embeds', 2);

	await deleteAllMessages(page);

	await optionsPage.close();
});

// =============================================================================
// Test: embed_link_filters
// Headless - 9/10 works
// =============================================================================
test('embed_link_filters: filter specific domains', async ({ context, page, extensionId }) => {
	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Ensure "Remove all embeds" is set to "off"
	const segmentedControl = optionsPage.locator('[data-qa="setting-remove-embeds-control"]');
	await expect(segmentedControl).toBeVisible();

	// Go to Slack and open tests channel
	await openTestSlackChannel(page, 'test-2');
	await deleteAllMessages(page);

	// DISABLED STATE: Post a message with github link, embed should appear
	await postMessageWithLink(page, 'https://github.com/wxt-dev/wxt');

	// Verify the embed/attachment appears (no filters yet)
	await expect(page.locator('.c-message_attachment')).toHaveCount(1, { timeout: 10000 });
	await deleteAllMessages(page);
	await expect(page.locator('.c-message_attachment')).toHaveCount(0, { timeout: 10000 });

	// ENABLED STATE: Set to "Remove some" mode to add a domain filter for github.com
	await optionsPage.bringToFront();
	const removeSomeOption = segmentedControl.locator('label:has-text("Remove some")');
	await removeSomeOption.click();
	await optionsPage.waitForTimeout(500);

	const addFilterBtn = optionsPage.locator('[data-qa="add-domain-filter-btn"]');
	await addFilterBtn.click();

	// Type in the domain filter
	const filterInput = optionsPage.locator('[data-qa="domain-filter-input-0"]');
	await expect(filterInput).toBeVisible();
	await filterInput.fill('github.com');
	await filterInput.blur(); // Trigger validation

	// Wait for settings to propagate to content script, then bring Slack to front
	await page.waitForTimeout(1000);
	await page.bringToFront();
	await postMessageWithLink(page, 'https://github.com/microsoft/vscode');

	// Post another github link - Run #2
	await postMessageWithLink(page, 'https://github.com/wxt-dev/wxt');

	// Post a non-github link and ensure embed exists - Run #3
	await postMessageWithLink(page, 'https://about.gitlab.com/solutions/continuous-integration/');
	await expect(page.locator('.c-message_attachment')).toHaveCount(1, { timeout: 10000 });

	// Verify usage count shows "Used 2 times" on tutorial page
	await verifyUsageCount(context, extensionId, 'remove_embeds', 2);

	await optionsPage.close();
	await deleteAllMessages(page);
});

// =============================================================================
// Test: auto_confirm_embed_removal
// 10x headless - works
// =============================================================================
test('auto_confirm_embed_removal: auto-confirm dialog', async ({ context, page, extensionId }) => {
	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Disable "auto-confirm embed removal" first
	const autoConfirmCheckbox = optionsPage.locator('[data-qa="setting-auto-confirm-embed-removal"]');
	// Default is checked, so uncheck it
	if (await autoConfirmCheckbox.isChecked()) {
		await autoConfirmCheckbox.uncheck();
	}
	await expect(autoConfirmCheckbox).not.toBeChecked();

	// Ensure embed mode is set to "off" (test manual removal)
	const segmentedControl = optionsPage.locator('[data-qa="setting-remove-embeds-control"]');
	const offOption = segmentedControl.locator('label:has-text("Off")');
	await offOption.click();
	await optionsPage.waitForTimeout(500);

	// Wait for settings to propagate before going to Slack
	await page.waitForTimeout(1000);

	// Go to Slack and open tests channel
	await openTestSlackChannel(page, 'test-3');
	await deleteAllMessages(page);

	// Create message with embed
	await postMessageWithLink(page);

	// DISABLED STATE: Click delete button on embed, confirmation dialog should appear
	await page.locator('.c-message_attachment').last().scrollIntoViewIfNeeded();
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

	const deleteButton = page.locator('.c-message_attachment__delete').last();
	await expect(deleteButton).toBeVisible({ timeout: 10000 });
	await deleteButton.click();

	// Confirmation dialog should appear
	const confirmDialog = page.locator('div[aria-label="Remove preview?"]');
	await expect(confirmDialog).toBeVisible({ timeout: 5000 });

	// Cancel the dialog
	const cancelButton = page.locator('[data-qa="dialog_cancel"]');
	await cancelButton.click();
	await expect(confirmDialog).toBeHidden();

	// ENABLED STATE: Enable auto-confirm
	await optionsPage.bringToFront();
	await autoConfirmCheckbox.check();
	await expect(autoConfirmCheckbox).toBeChecked();

	// Wait for settings to propagate to content script, then bring Slack to front
	await page.waitForTimeout(1000);
	await page.bringToFront();

	// Click delete button - Run #1 - dialog should auto-confirm
	const newDeleteButton = page.locator('.c-message_attachment__delete').last();
	await expect(newDeleteButton).toBeVisible({ timeout: 10000 });
	await newDeleteButton.click();

	// The dialog should either not appear or auto-dismiss
	await page.waitForTimeout(1000);
	const dialogAfterClick = page.locator('div[aria-label="Remove preview?"]');
	await expect(dialogAfterClick).toBeHidden({ timeout: 3000 });
	await expect(page.locator('.c-message_attachment')).toHaveCount(0, { timeout: 10000 });

	// Post and delete again - Run #2
	await postMessageWithLink(page);
	const anotherDeleteButton = page.locator('.c-message_attachment__delete').last();
	await expect(anotherDeleteButton).toBeVisible({ timeout: 10000 });
	await anotherDeleteButton.click();
	await page.waitForTimeout(1000);
	await expect(page.locator('.c-message_attachment')).toHaveCount(0, { timeout: 10000 });

	// Verify usage count shows "Used 2 times" on tutorial page
	await verifyUsageCount(context, extensionId, 'auto_confirm_embed_removal', 2);

	await optionsPage.close();
});

// =============================================================================
// Test: open_slack_links_in_browser
// =============================================================================
test('open_slack_links_in_browser: auto-redirect', async ({ context, page, extensionId }) => {
	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Disable "Open Slack links in browser" first
	const openInBrowserCheckbox = optionsPage.locator('[data-qa="setting-open-slack-links-in-browser"]');
	// Default is checked, so uncheck it
	if (await openInBrowserCheckbox.isChecked()) {
		await openInBrowserCheckbox.uncheck();
	}
	await expect(openInBrowserCheckbox).not.toBeChecked();

	// Get a test message link
	await openTestSlackChannel(page, 'test-4');
	await postMessageWithLink(page);
	const testMessageLink = await getTestMessageLink(page, context);
	await deleteAllMessages(page);

	// DISABLED STATE: Navigate to an /archives/ link
	// When disabled, the page will show options to open in app or browser
	await page.goto(testMessageLink, { waitUntil: 'commit' });
	await expect(page.locator('a.c-link[href^="/messages/"]')).toBeVisible({ timeout: 10000 });
	await page.waitForTimeout(3000);
	// Verify we're still on the archives page (not redirected)
	expect(page.url()).toContain('/archives/');
	await page.close();

	// ENABLED STATE: Enable the setting
	await optionsPage.bringToFront();
	await openInBrowserCheckbox.check();
	await expect(openInBrowserCheckbox).toBeChecked();
	await optionsPage.waitForTimeout(1000);

	// Wait for settings to propagate to content script, then bring Slack to front
	// Should auto-redirect to slack client. Trigger feature twice
	const newPage1 = await context.newPage();
	await newPage1.bringToFront();
	await newPage1.goto(testMessageLink, { waitUntil: 'commit' });
	await newPage1.focus('body');
	await expect(newPage1.locator('[data-qa="inline_channel_entity__name"]').first()).toBeVisible({ timeout: 30000 });
	expect(newPage1.url()).toContain('/app.slack.com/client/');
	await newPage1.close();

	const newPage2 = await context.newPage();
	await newPage2.bringToFront();
	await newPage2.goto(testMessageLink, { waitUntil: 'commit' });
	await newPage2.focus('body');
	await expect(newPage2.locator('[data-qa="inline_channel_entity__name"]').first()).toBeVisible({ timeout: 30000 });
	expect(newPage2.url()).toContain('/app.slack.com/client/');
	await newPage2.close();

	// Verify usage count shows "Used 2 times" on tutorial page
	await verifyUsageCount(context, extensionId, 'open_slack_links_in_browser', 2);
	await optionsPage.close();
});

// =============================================================================
// Test: message_export_format
// 10x headless - works
// TODO: Read delete messages, insert messages, verify clipboard/file contents matches, test export with thread
// =============================================================================
test('message_export_format: export functionality', async ({ context, page, extensionId }) => {
	// Go to Slack and open test channel
	await openTestSlackChannel(page, 'test-5');

	// Export button should be visible by default (default is 'clipboard')
	const exportButton = page.locator('[data-qa="slacky-export-btn-channel"]');
	await expect(exportButton).toBeVisible({ timeout: 15000 });

	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// DISABLED STATE: Set export format to "Disabled"
	const exportSelect = optionsPage.locator('[data-qa="message-export-format-select"]');
	await exportSelect.click();
	await optionsPage.locator('div[role="option"]:has-text("Disabled")').click();

	// Verify export button disappears
	await page.bringToFront();
	await page.waitForTimeout(1000);
	await expect(exportButton).toBeHidden({ timeout: 5000 });

	// ENABLED STATE: Set export format to "Clipboard"
	await optionsPage.bringToFront();
	await exportSelect.click();
	await optionsPage.locator('div[role="option"]:has-text("Clipboard")').click();

	// Verify export button reappears
	await page.bringToFront();
	await page.waitForTimeout(1000);
	await expect(exportButton).toBeVisible({ timeout: 5000 });

	// Click export button - Run #1 (clipboard)
	await exportButton.click();
	// Wait for export to complete (button shows checkmark when done)
	await page.waitForTimeout(5000);

	// MARKDOWN FILE: Set export format to "Markdown File"
	await optionsPage.bringToFront();
	await exportSelect.click();
	await optionsPage.locator('div[role="option"]:has-text("Markdown File")').click();

	// Click export button - Run #2 (markdown file) and verify download
	await page.bringToFront();
	await page.waitForTimeout(1000);

	// Start waiting for download before clicking
	const downloadPromise = page.waitForEvent('download');
	await exportButton.click();
	const download = await downloadPromise;

	// Verify the downloaded file name matches expected pattern (slack_export_*.md)
	expect(download.suggestedFilename()).toMatch(/^slack_export_.*\.md$/);

	// Verify usage count shows "Used 2 times" on tutorial page
	await verifyUsageCount(context, extensionId, 'message_export_format', 2);

	await optionsPage.close();
});

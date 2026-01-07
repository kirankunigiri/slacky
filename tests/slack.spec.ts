import { expect, test } from './fixtures';
import { deleteAllMessages, deleteLastMessage, getTestMessageLink, openTestSlackChannel, postMessageWithLink, verifyUsageCount, waitForChannelLoad } from './test-utils';

/**
 * Tests each feature. Features that track usage counts run twice to verify the count is incremented in the tutorial page.
 * Each test uses a separate Slack channel so they can run in parallel.
 *
 * Features:
 * - remove_all_embed_links
 * - embed_link_filters
 * - auto_confirm_embed_removal
 * - open_slack_links_in_browser
 * - message_export_format
 * - show_settings_button_in_slack
 */

// =============================================================================
// Test: show_settings_button_in_slack
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
// Test: remove_all_embed_links
// =============================================================================
test('remove_all_embed_links: toggle embed removal', async ({ context, page, extensionId }) => {
	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Ensure "Remove all embeds" is unchecked initially (disabled state)
	const removeAllCheckbox = optionsPage.locator('[data-qa="setting-remove-all-embeds"]');
	await expect(removeAllCheckbox).not.toBeChecked();

	// Go to Slack and open tests channel
	await openTestSlackChannel(page, 'test-1');
	await deleteAllMessages(page);

	// DISABLED STATE: Post a message with link, verify embed appears
	await postMessageWithLink(page);

	// Verify the embed/attachment appears (since setting is disabled)
	const attachment = page.locator('.c-message_attachment').last();
	await expect(attachment).toBeVisible({ timeout: 10000 });

	// Delete the last message (right-click on message, press Delete, then Enter to confirm)
	await deleteLastMessage(page);

	// ENABLED STATE: Enable the setting
	await optionsPage.bringToFront();
	await removeAllCheckbox.check();
	await expect(removeAllCheckbox).toBeChecked();

	// Post another message with link - Run #1
	await postMessageWithLink(page);

	// Run #2 - post another message to trigger the feature again
	await postMessageWithLink(page);

	// Ensure 0 attachments were created
	await expect(page.locator('.c-message_attachment')).toHaveCount(0, { timeout: 1000 });

	// Verify usage count shows "Used 2 times" on tutorial page
	await verifyUsageCount(context, extensionId, 'remove_embeds', 2);

	await deleteAllMessages(page);

	await optionsPage.close();
});

// =============================================================================
// Test: embed_link_filters
// =============================================================================
test('embed_link_filters: filter specific domains', async ({ context, page, extensionId }) => {
	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Ensure "Remove all embeds" is unchecked
	const removeAllCheckbox = optionsPage.locator('[data-qa="setting-remove-all-embeds"]');
	await expect(removeAllCheckbox).not.toBeChecked();

	// Go to Slack and open tests channel
	await openTestSlackChannel(page, 'test-2');
	await deleteAllMessages(page);

	// DISABLED STATE: Post a message with github link, embed should appear
	await postMessageWithLink(page, 'https://github.com/wxt-dev/wxt');

	// Verify the embed/attachment appears (no filters yet)
	await expect(page.locator('.c-message_attachment')).toHaveCount(1, { timeout: 10000 });
	await deleteAllMessages(page);
	await expect(page.locator('.c-message_attachment')).toHaveCount(0, { timeout: 10000 });

	// ENABLED STATE: Add a domain filter for github.com
	await optionsPage.bringToFront();
	const addFilterBtn = optionsPage.locator('[data-qa="add-domain-filter-btn"]');
	await addFilterBtn.click();

	// Type in the domain filter
	const filterInput = optionsPage.locator('[data-qa="domain-filter-input-0"]');
	await expect(filterInput).toBeVisible();
	await filterInput.fill('github.com');
	await filterInput.blur(); // Trigger validation

	// Post a github link - Run #1
	await page.bringToFront();
	await postMessageWithLink(page, 'https://github.com/microsoft/vscode');

	// Wait for embed to be created and removed
	await page.waitForTimeout(3000);

	// Post another github link - Run #2
	await postMessageWithLink(page, 'https://github.com/wxt-dev/wxt');
	await page.waitForTimeout(3000);

	// Post a non-github link and ensure embed exists - Run #3
	await postMessageWithLink(page, 'https://about.gitlab.com/solutions/continuous-integration/');
	await expect(page.locator('.c-message_attachment')).toHaveCount(1, { timeout: 10000 });

	// Verify usage count shows "Used 2 times" on tutorial page
	await verifyUsageCount(context, extensionId, 'remove_embeds', 2);

	await optionsPage.close();
});

// =============================================================================
// Test: auto_confirm_embed_removal
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

	// Ensure "Remove all embeds" is unchecked (we want manual removal)
	const removeAllCheckbox = optionsPage.locator('[data-qa="setting-remove-all-embeds"]');
	if (await removeAllCheckbox.isChecked()) {
		await removeAllCheckbox.uncheck();
	}

	// Go to Slack and open tests channel
	await openTestSlackChannel(page, 'test-3');
	await deleteAllMessages(page);

	// Create message with embed
	await postMessageWithLink(page);

	// DISABLED STATE: Click delete button on embed, confirmation dialog should appear
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
	const testMessageLink = await getTestMessageLink(page, context);

	// DISABLED STATE: Navigate to an /archives/ link
	// When disabled, the page will show options to open in app or browser
	await page.goto(testMessageLink, { waitUntil: 'commit' });
	await expect(page.locator('a.c-link[href^="/messages/"]')).toBeVisible({ timeout: 10000 });
	await page.waitForTimeout(3000);
	// Verify we're still on the archives page (not redirected)
	expect(page.url()).toContain('/archives/');

	// ENABLED STATE: Enable the setting
	await optionsPage.bringToFront();
	await openInBrowserCheckbox.check();
	await expect(openInBrowserCheckbox).toBeChecked();
	await page.bringToFront();

	// Should auto-redirect to slack client. Trigger feature twice
	for (let i = 0; i < 2; i++) {
		await page.goto(testMessageLink);
		await waitForChannelLoad(page);
		expect(page.url()).toContain('/app.slack.com/client/');
		await page.waitForTimeout(1000);
	}

	// Verify usage count shows "Used 2 times" on tutorial page
	await verifyUsageCount(context, extensionId, 'open_slack_links_in_browser', 2);
	await optionsPage.close();
});

// =============================================================================
// Test: message_export_format
// TODO: Read delete messages, insert messages, verify clipboard/file contents matches, test export with thread
// =============================================================================
test('message_export_format: export functionality', async ({ context, page, extensionId }) => {
	// Go to Slack and open test channel
	await openTestSlackChannel(page, 'test-5');

	// Wait for messages to load
	await page.waitForTimeout(2000);

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

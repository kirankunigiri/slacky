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
 * - pr_message (copy/send PR messages)
 */

// Available test channels in Slack workspace
const TEST_CHANNELS = {
	test1: 'test-1', // remove_embed_link_mode
	test2: 'test-2', // embed_link_filters
	test3: 'test-3', // auto_confirm_embed_removal
	test4: 'test-4', // open_slack_links_in_browser
	test5: 'test-5', // message_export_format
	test6: 'test-6', // pr_message: send button with single channel
	test7: 'test-7', // pr_message: auto-submit on/off
	test8: 'test-8', // pr_message: tab handling
	test9: 'test-9', // pr_message: multiple channels (no default) - channel 1
	test10: 'test-10', // pr_message: multiple channels (no default) - channel 2
	test11: 'test-11', // pr_message: multiple channels (with default) - channel 1
	test12: 'test-12', // pr_message: multiple channels (with default) - channel 2
} as const;

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
	await openTestSlackChannel(page, TEST_CHANNELS.test1);
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
	await openTestSlackChannel(page, TEST_CHANNELS.test2);
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
	await openTestSlackChannel(page, TEST_CHANNELS.test3);
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
	await openTestSlackChannel(page, TEST_CHANNELS.test4);
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
	await openTestSlackChannel(page, TEST_CHANNELS.test5);

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

// =============================================================================
// Test: PR Messages - Copy button
// =============================================================================
test('pr_message: copy button functionality', async ({ context, page, extensionId }) => {
	// Open GitHub PR page
	const prUrl = 'https://github.com/kirankunigiri/slacky/pull/1';
	await page.goto(prUrl);
	await page.waitForLoadState('networkidle');

	// Wait for PR buttons to load
	await page.waitForTimeout(2000);

	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Ensure "Copy PR messages" is enabled
	const copyCheckbox = optionsPage.locator('[data-qa="setting-copy-pr-message"]');
	if (!(await copyCheckbox.isChecked())) {
		await copyCheckbox.check();
	}
	await expect(copyCheckbox).toBeChecked();

	// Ensure "Send PR message to Slack" is disabled (so only copy button shows)
	const sendCheckbox = optionsPage.locator('[data-qa="setting-send-pr-message-to-slack"]');
	if (await sendCheckbox.isChecked()) {
		await sendCheckbox.uncheck();
	}
	await expect(sendCheckbox).not.toBeChecked();

	// Wait for settings to propagate
	await page.waitForTimeout(1000);
	await page.bringToFront();

	// Grant clipboard permissions
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);

	// Find the copy button (should be the only button visible)
	const copyButton = page.locator('button.js-title-edit-button').filter({ has: page.locator('svg') }).first();
	await expect(copyButton).toBeVisible({ timeout: 10000 });

	// Click copy button - Run #1
	await copyButton.click();

	// Wait for copy state to change (icon should change from copy to check)
	await page.waitForTimeout(500);

	// Verify clipboard contains PR message
	const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
	expect(clipboardContent).toContain('https://github.com/kirankunigiri/slacky/pull/1');
	expect(clipboardContent).toContain('https://github.com/kirankunigiri/slacky/pull/1 - For test (+1 / -84)');

	// Click copy button again - Run #2
	await page.waitForTimeout(2000); // Wait for button to reset
	await copyButton.click();
	await page.waitForTimeout(500);

	// Verify usage count shows "Used 2 times" on tutorial page
	await verifyUsageCount(context, extensionId, 'pr_message', 2);

	await optionsPage.close();
});

// =============================================================================
// Test: PR Messages - Send button with single channel
// =============================================================================
test('pr_message: send button with single channel', async ({ context, page, extensionId }) => {
	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Disable copy PR message checkbox
	const copyCheckbox = optionsPage.locator('[data-qa="setting-copy-pr-message"]');
	if (await copyCheckbox.isChecked()) {
		await copyCheckbox.uncheck();
	}
	await expect(copyCheckbox).not.toBeChecked();

	// Add a single Slack channel
	const addChannelBtn = optionsPage.locator('[data-qa="add-channel-btn"]');
	await addChannelBtn.click();

	// Fill in modal
	const modalUrlInput = optionsPage.locator('[data-qa="modal-channel-url-input"]');
	const modalNameInput = optionsPage.locator('[data-qa="modal-channel-name-input"]');
	const modalSubmitBtn = optionsPage.locator('[data-qa="modal-submit-channel-btn"]');

	// Get test channel URL
	await openTestSlackChannel(page, TEST_CHANNELS.test6);
	const testChannelUrl = page.url();
	await deleteAllMessages(page);

	// Fill modal and submit
	await optionsPage.bringToFront();
	await modalUrlInput.fill(testChannelUrl);
	await modalNameInput.fill('test-channel');
	await modalSubmitBtn.click();

	// Verify the channel was added
	await expect(optionsPage.locator('[data-qa="channel-url-input-0"]')).toHaveValue(testChannelUrl);
	await expect(optionsPage.locator('[data-qa="channel-name-input-0"]')).toHaveValue('test-channel');

	// Open GitHub PR page
	const prUrl = 'https://github.com/kirankunigiri/slacky/pull/1';
	const prPage = await context.newPage();
	await prPage.goto(prUrl);
	await prPage.waitForLoadState('networkidle');
	await prPage.waitForTimeout(2000);

	// STATE 1: Single channel - should show logo + channel name
	const sendButton = prPage.locator('button.js-title-edit-button').filter({ hasText: '#test-channel' });
	await expect(sendButton).toBeVisible({ timeout: 10000 });

	// Click send button - Run #1
	await sendButton.click();

	// Wait for Slack tab to open and message to be sent
	await page.bringToFront();
	await page.waitForTimeout(3000);

	// Verify message was sent to Slack channel (auto-submit is off by default)
	const messageInput = page.locator('[data-qa="message_input"]');
	const inputText = await messageInput.textContent();
	expect(inputText).toContain('https://github.com/kirankunigiri/slacky/pull/1');

	await deleteAllMessages(page);
	await optionsPage.close();
	await prPage.close();
});

// =============================================================================
// Test: PR Messages - Send button with multiple channels (no default)
// 10x headless - works
// =============================================================================
test('pr_message: send button with multiple channels (no default)', async ({ context, page, extensionId }) => {
	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Disable copy PR message checkbox
	const copyCheckbox = optionsPage.locator('[data-qa="setting-copy-pr-message"]');
	if (await copyCheckbox.isChecked()) {
		await copyCheckbox.uncheck();
	}
	await expect(copyCheckbox).not.toBeChecked();

	// Add two Slack channels (no default)
	await openTestSlackChannel(page, TEST_CHANNELS.test9);
	const testChannel1Url = page.url();
	await deleteAllMessages(page);

	await openTestSlackChannel(page, TEST_CHANNELS.test10);
	const testChannel2Url = page.url();
	await deleteAllMessages(page);

	// Add first channel
	await optionsPage.bringToFront();
	let addChannelBtn = optionsPage.locator('[data-qa="add-channel-btn"]');
	await addChannelBtn.click();
	await optionsPage.locator('[data-qa="modal-channel-url-input"]').fill(testChannel1Url);
	await optionsPage.locator('[data-qa="modal-channel-name-input"]').fill('channel-1');
	await optionsPage.locator('[data-qa="modal-submit-channel-btn"]').click();
	await optionsPage.waitForTimeout(500);

	// Add second channel
	addChannelBtn = optionsPage.locator('[data-qa="add-channel-btn"]');
	await addChannelBtn.click();
	await optionsPage.locator('[data-qa="modal-channel-url-input"]').fill(testChannel2Url);
	await optionsPage.locator('[data-qa="modal-channel-name-input"]').fill('channel-2');
	await optionsPage.locator('[data-qa="modal-submit-channel-btn"]').click();
	await optionsPage.waitForTimeout(500);

	// Verify channels were added
	await expect(optionsPage.locator('[data-qa="channel-url-input-0"]')).toHaveValue(testChannel1Url);
	await expect(optionsPage.locator('[data-qa="channel-url-input-1"]')).toHaveValue(testChannel2Url);

	// Open GitHub PR page
	const prUrl = 'https://github.com/kirankunigiri/slacky/pull/1';
	const prPage = await context.newPage();
	await prPage.goto(prUrl);
	await prPage.waitForLoadState('networkidle');
	await prPage.waitForTimeout(2000);

	// STATE 2: Multiple channels, no default - should show only logo
	const sendButton = prPage.locator('button.js-title-edit-button').filter({ has: prPage.locator('svg[viewBox="0 0 80 80"]') }).first();
	await expect(sendButton).toBeVisible({ timeout: 10000 });

	// Verify button does NOT show channel name text
	await expect(sendButton).not.toContainText('#');

	// Click button to open dropdown - Run #1
	await sendButton.click();
	await prPage.waitForTimeout(500);

	// Verify dropdown is visible with both channels (use more specific selector)
	await expect(prPage.locator('.ActionListItem-label:has-text("channel-1")')).toBeVisible();
	await expect(prPage.locator('.ActionListItem-label:has-text("channel-2")')).toBeVisible();

	// Select channel-1 from dropdown
	await prPage.locator('.ActionListItem-label:has-text("channel-1")').click();

	// Wait for Slack tab to be focused and message to be sent
	await page.waitForTimeout(5000);

	// Find the Slack tab that was opened/focused
	const slackPages = context.pages().filter(p => p.url().includes('app.slack.com'));
	const slackPage = slackPages[slackPages.length - 1]; // Get the most recently focused page

	// Verify message was sent to channel-1
	const messageInput = slackPage.locator('[data-qa="message_input"]');
	const inputText = await messageInput.textContent();
	expect(inputText).toContain('https://github.com/kirankunigiri/slacky/pull/1');

	// Clean up - clear message input
	await messageInput.click();
	await slackPage.keyboard.press('Control+A');
	await slackPage.keyboard.press('Backspace');
	await optionsPage.close();
	await prPage.close();
});

// =============================================================================
// Test: PR Messages - Send button with multiple channels (with default)
// 10x headless - works
// =============================================================================
test('pr_message: send button with multiple channels (with default)', async ({ context, page, extensionId }) => {
	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Disable copy PR message checkbox
	const copyCheckbox = optionsPage.locator('[data-qa="setting-copy-pr-message"]');
	if (await copyCheckbox.isChecked()) {
		await copyCheckbox.uncheck();
	}
	await expect(copyCheckbox).not.toBeChecked();

	// Add two Slack channels with first as default
	await openTestSlackChannel(page, TEST_CHANNELS.test11);
	const testChannel1Url = page.url();
	await deleteAllMessages(page);

	await openTestSlackChannel(page, TEST_CHANNELS.test12);
	const testChannel2Url = page.url();
	await deleteAllMessages(page);

	// Add first channel (set as default)
	await optionsPage.bringToFront();
	let addChannelBtn = optionsPage.locator('[data-qa="add-channel-btn"]');
	await addChannelBtn.click();
	await optionsPage.locator('[data-qa="modal-channel-url-input"]').fill(testChannel1Url);
	await optionsPage.locator('[data-qa="modal-channel-name-input"]').fill('default-channel');
	await optionsPage.locator('[data-qa="modal-channel-default-checkbox"]').check();
	await optionsPage.locator('[data-qa="modal-submit-channel-btn"]').click();
	await optionsPage.waitForTimeout(500);

	// Add second channel (not default)
	addChannelBtn = optionsPage.locator('[data-qa="add-channel-btn"]');
	await addChannelBtn.click();
	await optionsPage.locator('[data-qa="modal-channel-url-input"]').fill(testChannel2Url);
	await optionsPage.locator('[data-qa="modal-channel-name-input"]').fill('other-channel');
	await optionsPage.locator('[data-qa="modal-submit-channel-btn"]').click();
	await optionsPage.waitForTimeout(500);

	// Open GitHub PR page
	const prUrl = 'https://github.com/kirankunigiri/slacky/pull/1';
	const prPage = await context.newPage();
	await prPage.goto(prUrl);
	await prPage.waitForLoadState('networkidle');
	await prPage.waitForTimeout(2000);

	// STATE 3: Multiple channels with default - should show split button
	// Left side: logo + default channel name
	const mainButton = prPage.locator('button.js-title-edit-button').filter({ hasText: '#default-channel' });
	await expect(mainButton).toBeVisible({ timeout: 10000 });

	// Right side: dropdown icon button
	const dropdownButton = prPage.locator('button.js-title-edit-button').filter({ has: prPage.locator('svg.octicon-triangle-down') }).first();
	await expect(dropdownButton).toBeVisible({ timeout: 10000 });

	// Click main button to send to default channel - Run #1
	await mainButton.click();

	// Wait for Slack tab to be focused and message to be sent
	await page.waitForTimeout(5000);

	// Find the Slack tab that was opened/focused
	let slackPages = context.pages().filter(p => p.url().includes('app.slack.com'));
	let slackPage = slackPages[slackPages.length - 1];

	// Verify message was sent to default channel
	let messageInput = slackPage.locator('[data-qa="message_input"]');
	let inputText = await messageInput.textContent();
	expect(inputText).toContain('https://github.com/kirankunigiri/slacky/pull/1');

	// Clear the message input
	await messageInput.click();
	await slackPage.keyboard.press('Control+A');
	await slackPage.keyboard.press('Backspace');

	// Now test dropdown button - Run #2
	await prPage.bringToFront();
	await dropdownButton.click();
	await prPage.waitForTimeout(500);

	// Verify dropdown shows only the non-default channel
	await expect(prPage.locator('.ActionListItem-label:has-text("other-channel")')).toBeVisible();
	// Default channel should NOT be in dropdown
	await expect(prPage.locator('.ActionListItem-label:has-text("default-channel")')).not.toBeVisible();

	// Select other-channel from dropdown
	await prPage.locator('.ActionListItem-label:has-text("other-channel")').click();

	// Wait for Slack tab to be focused and message to be sent
	await page.waitForTimeout(5000);

	// Find the Slack tab that was opened/focused
	slackPages = context.pages().filter(p => p.url().includes('app.slack.com'));
	slackPage = slackPages[slackPages.length - 1];

	// Verify message was sent to other channel
	messageInput = slackPage.locator('[data-qa="message_input"]');
	inputText = await messageInput.textContent();
	expect(inputText).toContain('https://github.com/kirankunigiri/slacky/pull/1');

	// Verify usage count shows "Used 2 times" on tutorial page
	await verifyUsageCount(context, extensionId, 'pr_message', 2);

	// Clean up - clear message input
	await messageInput.click();
	await slackPage.keyboard.press('Control+A');
	await slackPage.keyboard.press('Backspace');

	await optionsPage.close();
	await prPage.close();
});

// =============================================================================
// Test: PR Messages - Auto-submit on/off
// 10x headless - works
// =============================================================================
test('pr_message: auto-submit on/off', async ({ context, page, extensionId }) => {
	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Disable copy PR message checkbox
	const copyCheckbox = optionsPage.locator('[data-qa="setting-copy-pr-message"]');
	if (await copyCheckbox.isChecked()) {
		await copyCheckbox.uncheck();
	}
	await expect(copyCheckbox).not.toBeChecked();

	// Add a single Slack channel
	await openTestSlackChannel(page, TEST_CHANNELS.test7);
	const testChannelUrl = page.url();
	await deleteAllMessages(page);

	await optionsPage.bringToFront();
	const addChannelBtn = optionsPage.locator('[data-qa="add-channel-btn"]');
	await addChannelBtn.click();
	await optionsPage.locator('[data-qa="modal-channel-url-input"]').fill(testChannelUrl);
	await optionsPage.locator('[data-qa="modal-channel-name-input"]').fill('auto-test');
	await optionsPage.locator('[data-qa="modal-submit-channel-btn"]').click();
	await optionsPage.waitForTimeout(500);

	// STATE 1: Auto-submit OFF (default)
	const autoSubmitCheckbox = optionsPage.locator('[data-qa="setting-auto-submit-pr-message"]');
	await expect(autoSubmitCheckbox).not.toBeChecked();

	// Open GitHub PR page
	const prUrl = 'https://github.com/kirankunigiri/slacky/pull/1';
	const prPage = await context.newPage();
	await prPage.goto(prUrl);
	await prPage.waitForLoadState('networkidle');
	await prPage.waitForTimeout(2000);

	// Click send button
	const sendButton = prPage.locator('button.js-title-edit-button').filter({ hasText: '#auto-test' });
	await expect(sendButton).toBeVisible({ timeout: 10000 });
	await sendButton.click();

	// Wait for Slack tab
	await page.bringToFront();
	await page.waitForTimeout(3000);

	// Verify message is filled in input but NOT sent (no new message in channel)
	const messageInput = page.locator('[data-qa="message_input"]');
	const inputText = await messageInput.textContent();
	expect(inputText).toContain('https://github.com/kirankunigiri/slacky/pull/1');

	// Verify no message was actually sent to channel
	const messageCount = await page.locator('.c-message_kit__message').count();
	expect(messageCount).toBe(0);

	// Clear the input
	await messageInput.click();
	await page.keyboard.press('Control+A');
	await page.keyboard.press('Backspace');

	// STATE 2: Auto-submit ON
	await optionsPage.bringToFront();
	await autoSubmitCheckbox.check();
	await expect(autoSubmitCheckbox).toBeChecked();
	await optionsPage.waitForTimeout(1000);

	// Click send button again
	await prPage.bringToFront();
	await sendButton.click();

	// Wait for Slack tab
	await page.bringToFront();
	await page.waitForTimeout(3000);

	// Verify message WAS sent (new message appears in channel)
	await expect(page.locator('.c-message_kit__message')).toHaveCount(1, { timeout: 10000 });
	const lastMessage = page.locator('.c-message_kit__message').last();
	await expect(lastMessage).toContainText('https://github.com/kirankunigiri/slacky/pull/1');

	await deleteAllMessages(page);
	await optionsPage.close();
	await prPage.close();
});

// =============================================================================
// Test: PR Messages - Tab handling (new tab vs focus existing)
// 10x headless - works
// =============================================================================
test('pr_message: tab handling (new tab vs focus existing)', async ({ context, page, extensionId }) => {
	// Open options page to configure settings
	const optionsPage = await context.newPage();
	await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
	await optionsPage.waitForLoadState('networkidle');

	// Disable copy PR message checkbox
	const copyCheckbox = optionsPage.locator('[data-qa="setting-copy-pr-message"]');
	if (await copyCheckbox.isChecked()) {
		await copyCheckbox.uncheck();
	}
	await expect(copyCheckbox).not.toBeChecked();

	// Add a single Slack channel
	await openTestSlackChannel(page, TEST_CHANNELS.test8);
	const testChannelUrl = page.url();
	await deleteAllMessages(page);

	await optionsPage.bringToFront();
	const addChannelBtn = optionsPage.locator('[data-qa="add-channel-btn"]');
	await addChannelBtn.click();
	await optionsPage.locator('[data-qa="modal-channel-url-input"]').fill(testChannelUrl);
	await optionsPage.locator('[data-qa="modal-channel-name-input"]').fill('tab-test');
	await optionsPage.locator('[data-qa="modal-submit-channel-btn"]').click();
	await optionsPage.waitForTimeout(500);

	// Close the Slack page to test new tab creation
	await page.close();

	// Open GitHub PR page
	const prUrl = 'https://github.com/kirankunigiri/slacky/pull/1';
	const prPage = await context.newPage();
	await prPage.goto(prUrl);
	await prPage.waitForLoadState('networkidle');
	await prPage.waitForTimeout(2000);

	// TEST 1: No existing tab - should create new tab
	const sendButton = prPage.locator('button.js-title-edit-button').filter({ hasText: '#tab-test' });
	await expect(sendButton).toBeVisible({ timeout: 10000 });

	// Count pages before click
	const pagesBefore = context.pages().length;

	// Click send button
	await sendButton.click();
	await prPage.waitForTimeout(3000);

	// Verify a new tab was created
	const pagesAfter = context.pages().length;
	expect(pagesAfter).toBeGreaterThan(pagesBefore);

	// Find the new Slack tab
	const slackTab = context.pages().find(p => p.url().includes(testChannelUrl));
	expect(slackTab).toBeDefined();

	// TEST 2: Existing tab - should focus existing tab instead of creating new one
	await prPage.bringToFront();
	const pagesBeforeSecondClick = context.pages().length;

	// Click send button again
	await sendButton.click();
	await prPage.waitForTimeout(3000);

	// Verify no new tab was created (count should be the same)
	const pagesAfterSecondClick = context.pages().length;
	expect(pagesAfterSecondClick).toBe(pagesBeforeSecondClick);

	// Verify the existing Slack tab is now active
	const activeTab = context.pages().find(p => p.url().includes(testChannelUrl));
	expect(activeTab).toBeDefined();

	// Clean up
	if (slackTab) {
		const messageInput = slackTab.locator('[data-qa="message_input"]');
		await messageInput.click();
		await slackTab.keyboard.press('Control+A');
		await slackTab.keyboard.press('Backspace');
		await slackTab.close();
	}
	await optionsPage.close();
	await prPage.close();
});

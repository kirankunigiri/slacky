import { trackEvent } from '@/utils/analytics';
import { TEST_SLACK_URL } from '@/utils/constants';
import { onMessage, sendMessage } from '@/utils/messaging';
import { browser, defineBackground } from '#imports';

export default defineBackground(() => {
	// Open tutorial page on first install
	browser.runtime.onInstalled.addListener((details) => {
		if (details.reason === 'install') {
			browser.tabs.create({
				url: browser.runtime.getURL('/tutorial.html'),
			});
		}
	});

	// --------------------------------------------------------------------------------
	// Message handlers
	// --------------------------------------------------------------------------------

	// trackEvent
	onMessage('trackEvent', (message) => {
		trackEvent(message.data);
	});

	// sendSlackMessage
	onMessage('sendSlackMessage', async (message) => {
		// Get all tabs with Slack open
		const tabs = await browser.tabs.query({ url: `${TEST_SLACK_URL}*` });

		// TODO: Only send to the first tab. If no tab found, open in a new tab
		// Send message to all Slack tabs
		for (const tab of tabs) {
			if (tab.id) {
				// Make the first tab active and focus its window
				if (tab === tabs[0] && tab.windowId) {
					await browser.tabs.update(tab.id, { active: true });
					await browser.windows.update(tab.windowId, { focused: true });
				}

				await sendMessage('submitSlackMessage', { text: message.data.text }, tab.id);
			}
		}
	});
});

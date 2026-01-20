import { trackEvent } from '@/utils/analytics';
import { onMessage, sendMessage } from '@/utils/messaging';
import { Browser, browser, defineBackground } from '#imports';

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
		const tabs = await browser.tabs.query({ url: `${message.data.channel.url}*` });

		let targetTab: Browser.tabs.Tab;

		if (tabs.length > 0) {
			// Use the first existing Slack tab
			targetTab = tabs[0];
		} else {
			// No Slack tab found, open a new one
			targetTab = await browser.tabs.create({ url: message.data.channel.url });
		}

		if (targetTab?.id) {
			// Make the tab active and focus its window
			if (targetTab.windowId) {
				await browser.tabs.update(targetTab.id, { active: true });
				await browser.windows.update(targetTab.windowId, { focused: true });
			}

			await waitForTabComplete(targetTab.id);

			// browser.tabs.executeScript()
			await sendMessage('submitSlackMessage', message.data, targetTab.id);
		}
	});
});

async function waitForTabComplete(tabId: number) {
	const tab = await browser.tabs.get(tabId);
	if (tab.status === 'complete') return;

	await new Promise<void>((resolve) => {
		const listener = (updatedTabId: number, info: Browser.tabs.OnUpdatedInfo) => {
			if (updatedTabId === tabId && info.status === 'complete') {
				browser.tabs.onUpdated.removeListener(listener);
				resolve();
			}
		};
		browser.tabs.onUpdated.addListener(listener);
	});
}

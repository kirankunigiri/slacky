import { trackEvent } from '@/utils/analytics';
import { onMessage } from '@/utils/messaging';
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

	// Message handlers
	onMessage('trackEvent', (message) => {
		trackEvent(message.data);
	});
});

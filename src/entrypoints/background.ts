import { createBackgroundService } from '@/utils/messaging';
import { registerBackgroundService } from '@/utils/messaging-keys';
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

	// Listen for messages from content
	registerBackgroundService(createBackgroundService());
});

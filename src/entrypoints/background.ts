import { registerBackgroundService } from '@/utils/messaging';

export default defineBackground(() => {
	console.log('Hello background!', { id: browser.runtime.id });

	// Open tutorial page on first install
	browser.runtime.onInstalled.addListener((details) => {
		if (details.reason === 'install') {
			browser.tabs.create({
				url: browser.runtime.getURL('/tutorial.html'),
			});
		}
	});

	// Listen for messages from content scripts
	registerBackgroundService();
});

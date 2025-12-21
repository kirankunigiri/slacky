export default defineBackground(() => {
	console.log('Hello background!', { id: browser.runtime.id });

	// Listen for messages from content scripts
	browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		console.log('Background received message:', message);

		if (message.action === 'openPopup') {
			// Handle async operation
			(async () => {
				try {
					await browser.action.openPopup();
					sendResponse({ success: true });
				} catch (error) {
					console.error('Failed to open popup:', error);
					sendResponse({ success: false, error: (error as Error).message });
				}
			})();

			return true; // Keep the message channel open for async response
		}
	});
});

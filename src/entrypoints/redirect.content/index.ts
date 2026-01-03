/** Opens the browser Slack link immediately when visiting /archives links that try to open the desktop app */
export default defineContentScript({
	matches: ['*://*.slack.com/archives/*'],
	main() {
		if (document.body) {
			startMonitoring();
		} else {
			document.addEventListener('DOMContentLoaded', startMonitoring);
		}
	},
});

/** Observes for the browser Slack link appearing and navigates to it */
const startMonitoring = async () => {
	if (await findAndOpenBrowserSlackLink()) return;

	const observer = new MutationObserver(async (mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
				if (await findAndOpenBrowserSlackLink()) {
					observer.disconnect();
					return;
				}
			}
		}
	});

	if (!document.body) console.error('No body found');
	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
};

/** Finds the browser Slack link and navigates to it */
const findAndOpenBrowserSlackLink = async () => {
	// Check if setting is enabled
	await loadSettings();
	const openSlackLinksInBrowser = settings$.open_slack_links_in_browser.get();
	if (!openSlackLinksInBrowser) return false;

	// Find and open browser link
	const links = document.querySelectorAll('a.c-link[target="_self"]');
	for (const link of links) {
		if (link.getAttribute('href')?.startsWith('/messages/')) {
			const href = link.getAttribute('href');
			if (href) {
				window.location.href = href;
				return true;
			}
		}
	}
	return false;
};

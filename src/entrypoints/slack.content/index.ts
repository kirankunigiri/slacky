import { removeEmbeds } from '@/entrypoints/slack.content/remove-embeds';

export default defineContentScript({
	matches: ['*://*.slack.com/*'],
	main() {
		console.log('slack.content content script loaded.');
		removeEmbeds();
	},
});

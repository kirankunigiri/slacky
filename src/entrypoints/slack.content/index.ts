import { removeSlackAttachments } from '@/entrypoints/slack.content/remove-slack-attachments';

export default defineContentScript({
	matches: ['*://*.slack.com/*'],
	main() {
		console.log('slack.content content script loaded.');
		removeSlackAttachments();
	},
});

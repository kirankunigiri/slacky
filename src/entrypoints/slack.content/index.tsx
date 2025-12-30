import ExportMessagesButton from '@/entrypoints/slack.content/export-btn';
import removeEmbeds from '@/entrypoints/slack.content/remove-embeds';
import SettingsButton from '@/entrypoints/slack.content/settings-btn';

export default defineContentScript({
	matches: ['*://*.slack.com/*'],
	main() {
		console.log('slack.content content script loaded.');

		// Remove embeds
		removeEmbeds();

		// Export buttons
		injectComponent({
			parentSelector: '.p-view_header__actions',
			componentId: 'slacky-export-channel-messages',
			Component: () => <ExportMessagesButton type="channel" />,
			position: 'child-first',
		});

		injectComponent({
			parentSelector: '[data-qa="secondary-header-more"]',
			componentId: 'slacky-export-thread-messages',
			Component: () => <ExportMessagesButton type="thread" />,
			position: 'sibling-before',
		});

		// Settings button
		injectComponent({
			parentSelector: '[class$="top_nav__right_container"]',
			componentId: 'slacky-settings',
			Component: SettingsButton,
			position: 'child-first',
		});
	},
});

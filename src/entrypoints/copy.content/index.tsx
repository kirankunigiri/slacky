import { ExportMessagesButton } from '@/entrypoints/copy.content/copy';
import { injectComponent } from '@/utils/injector';

/** Adds buttons to copy all messages in a channel/thread in the toolbar */
export default defineContentScript({
	matches: ['*://*.slack.com/*'],
	main() {
		injectComponent({
			parentSelector: '.p-view_header__actions',
			componentId: 'slacky-export-channel-messages',
			Component: () => <ExportMessagesButton type="channel" output="clipboard" />,
			position: 'child-first',
		});

		injectComponent({
			parentSelector: '[data-qa="secondary-header-more"]',
			componentId: 'slacky-export-thread-messages',
			Component: () => <ExportMessagesButton type="thread" output="clipboard" />,
			position: 'sibling-before',
		});
	},
});

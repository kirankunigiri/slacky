import PRButtonGraphite from '@/entrypoints/pr-graphite.content/pr-btn-graphite';
import { injectComponent } from '@/utils/injector';
import { defineContentScript } from '#imports';

export default defineContentScript({
	// TODO: narrow pattern for graphite pr's only
	matches: ['*://app.graphite.com/*'],
	main() {
		// Settings button
		injectComponent({
			parentSelector: '.utilities_flexShrink0__EKj1B',
			componentId: 'graphite-slacky-pr',
			Component: PRButtonGraphite,
			position: 'child-first',
			parentStyle: {
				display: 'flex',
				order: 2,
				gap: '4px',
			},
		});
	},
});

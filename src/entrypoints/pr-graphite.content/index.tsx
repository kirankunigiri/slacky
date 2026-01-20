import PRButtonsGraphite from '@/entrypoints/pr-graphite.content/pr-btn-graphite';
import { injectComponent } from '@/utils/injector';
import { defineContentScript } from '#imports';

export default defineContentScript({
	matches: ['*://app.graphite.com/github/pr/*'],
	main() {
		// Settings button
		injectComponent({
			parentSelector: '.utilities_flexShrink0__EKj1B',
			componentId: 'graphite-slacky-pr',
			Component: PRButtonsGraphite,
			position: 'child-first',
			parentStyle: {
				display: 'flex',
				gap: '6px',
				alignSelf: 'stretch',
			},
		});
	},
});

import PRButtonGitHub from '@/entrypoints/pr-github.content/pr-btn-github';
import { injectComponent } from '@/utils/injector';
import { defineContentScript } from '#imports';

export default defineContentScript({
	matches: ['*://github.com/*/*/pull/*'],
	main() {
		// Settings button
		injectComponent({
			parentSelector: '[aria-label="Edit Pull Request title"]',
			componentId: 'open-pr',
			Component: PRButtonGitHub,
			position: 'sibling-before',
			parentStyle: {
				display: 'flex',
				order: 2,
				gap: '4px',
			},
		});
	},
});

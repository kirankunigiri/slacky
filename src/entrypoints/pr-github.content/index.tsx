import PRButtonsGitHub from '@/entrypoints/pr-github.content/pr-btn-github';
import { injectComponent } from '@/utils/injector';
import { defineContentScript } from '#imports';

export default defineContentScript({
	matches: ['*://github.com/*/*/pull/*'],
	main() {
		// Send PR and Copy PR Message buttons
		injectComponent({
			parentSelector: '.gh-header-actions',
			componentId: 'open-pr',
			Component: PRButtonsGitHub,
			position: 'child-first',
			parentStyle: {
				display: 'flex',
				order: 2,
				gap: '4px',
			},
		});
	},
});

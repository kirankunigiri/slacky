import ReactDOM from 'react-dom/client';

import Settings from '@/entrypoints/settings.content/Settings';

/** Adds the Slacky Settings button to the top right navbar in Slack */
export default defineContentScript({
	matches: ['*://*.slack.com/*'],
	main(ctx) {
		const ui = createIntegratedUi(ctx, {
			position: 'inline',
			anchor: () => document.querySelector('[class$="top_nav__right_container"]'),
			append: 'first',
			onMount: (container) => {
				const root = ReactDOM.createRoot(container);
				root.render(<Settings />);
				return root;
			},
			onRemove: (root) => {
				root?.unmount();
			},
		});

		ui.autoMount();
	},
});

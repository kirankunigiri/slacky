import { IconCheck, IconCopy, IconLoader2 } from '@tabler/icons-react';

import { copyMessages, CopyMessagesOptions } from '@/entrypoints/slack.content/export';

export function ExportMessagesButton(options: CopyMessagesOptions) {
	const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied'>('idle');

	const handleClick = async () => {
		if (copyState === 'copying') return;
		setCopyState('copying');
		try {
			await copyMessages(options);
			setCopyState('copied');
			setTimeout(() => {
				setCopyState('idle');
			}, 2000);
		} catch {
			setCopyState('idle');
		}
	};

	return (
		<button
			// eslint-disable-next-line better-tailwindcss/no-unregistered-classes
			className="c-button-unstyled p-top_nav__button p-top_nav__help"
			data-qa="highlight-btn"
			aria-label="Slacky Settings"
			data-sk="tooltip_parent"
			type="button"
			tabIndex={-1}
			onClick={handleClick}
		>
			{copyState === 'idle' && <IconCopy size={16} />}
			{copyState === 'copying' && (
				<span
					style={{
						display: 'inline-flex',
						animation: 'spin 1s linear infinite',
					}}
				>
					<style>
						{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
					</style>
					<IconLoader2 size={16} />
				</span>
			)}
			{copyState === 'copied' && <IconCheck size={16} />}
		</button>
	);
}

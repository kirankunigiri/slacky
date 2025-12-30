import { IconCheck, IconCopy, IconLoader2 } from '@tabler/icons-react';

/**
 * Slack Message Exporter - export all message in a channel or thread
 * - Scrolling is required because the message lists are virtualized
 * - Export to clipboard or markdown file
 */

interface CopyMessagesOptions {
	type: 'channel' | 'thread'
	output: 'clipboard' | 'file'
}

const SELECTORS = {
	channel: '#message-list .c-scrollbar__hider',
	thread: '.p-threads_flexpane_container .c-scrollbar__hider',
} as const;

export const copyMessages = async (options: CopyMessagesOptions) => {
	const { type, output } = options;

	document.body.click();

	const allMessages = new Map();

	// Find the scrollable container based on type
	const messageContainer = document.querySelector<HTMLElement>(SELECTORS[type]);

	if (!messageContainer) {
		throw new Error(`Could not find ${type} container`);
	}

	const maxScroll = messageContainer.scrollHeight - messageContainer.clientHeight;
	const container = messageContainer; // Store reference for nested function

	// Function to extract messages
	function extractVisibleMessages() {
		const messageElements = container.querySelectorAll('[data-qa="virtual-list-item"]');
		let newCount = 0;

		messageElements.forEach((element) => {
			try {
				const contentElement = element.querySelector('[data-qa="message-text"]') as HTMLElement | null;
				if (!contentElement) return;

				const content = contentElement.innerText.trim();
				if (!content) return;

				// Look for the timestamp link (it's in a <a> tag with class c-timestamp)
				let rawTimestamp = '';
				let displayTime = 'No timestamp';

				// TODO: Also try data-msg-ts
				// Try to find the timestamp link
				const timestampLink = element.querySelector('a.c-link.c-timestamp');
				if (timestampLink) {
					// Get aria-label which has the full date/time
					const ariaLabel = timestampLink.getAttribute('aria-label');
					if (ariaLabel) {
						displayTime = ariaLabel;
					}

					// Get data-ts for unique ID and sorting (Unix timestamp)
					rawTimestamp = timestampLink.getAttribute('data-ts') ?? '';
				}

				// Fallback: try the old selector
				if (displayTime === 'No timestamp') {
					const timeElement = element.querySelector('[data-qa="message_timestamp"]') as HTMLElement | null;
					if (timeElement) {
						displayTime = timeElement.getAttribute('aria-label') || timeElement.innerText.trim();
						rawTimestamp = timeElement.getAttribute('data-ts') ?? '';
					}
				}

				const itemKey = element.getAttribute('data-item-key')
					|| `${rawTimestamp}_${content.substring(0, 100)}`;

				if (allMessages.has(itemKey)) return;

				const usernameElement = element.querySelector('[data-qa="message_sender"]') as HTMLElement | null;
				let username = 'Unknown';

				if (usernameElement) {
					username = usernameElement.innerText.trim();
				} else {
					// Fallback to other username selectors
					const altUsername = element.querySelector('.c-message__sender') as HTMLElement | null;
					if (altUsername) {
						username = altUsername.innerText.trim();
					}
				}

				allMessages.set(itemKey, {
					username,
					timestamp: displayTime,
					rawTimestamp: parseFloat(rawTimestamp) || 0, // Unix timestamp for sorting
					content,
					id: itemKey,
				});
				newCount++;
			} catch (e) {
				console.warn('Error extracting message:', e);
			}
		});

		return newCount;
	}

	// Scroll to bottom first
	messageContainer.scrollTop = maxScroll;
	await new Promise(resolve => setTimeout(resolve, 1000));

	// Extract initial messages
	extractVisibleMessages();

	// Scroll UP through history

	let stuckCount = 0;
	let iterations = 0;

	while (iterations < 500) {
		const beforeScroll = messageContainer.scrollTop;
		messageContainer.scrollTop = Math.max(0, beforeScroll - 800);
		await new Promise(resolve => setTimeout(resolve, 500));

		const afterScroll = messageContainer.scrollTop;

		if (Math.abs(beforeScroll - afterScroll) < 10) {
			stuckCount++;
			if (stuckCount >= 5) break;
		} else {
			stuckCount = 0;
		}

		extractVisibleMessages();

		if (afterScroll <= 5) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			extractVisibleMessages();
			break;
		}

		iterations++;
	}

	// Format messages - sort by rawTimestamp (earliest first)
	const messages = Array.from(allMessages.values()).sort((a, b) => a.rawTimestamp - b.rawTimestamp);

	const channelName = (document.querySelector('[data-qa="channel_name"]') as HTMLElement | null)?.innerText || document.title.split(' - ')[0] || 'Slack Channel';

	// Format as Markdown
	let formattedText = `# Slack Messages\n\n`;
	formattedText += `**Type:** ${type === 'thread' ? 'Thread' : 'Channel'}\n`;
	formattedText += `**Channel:** ${channelName}\n`;
	formattedText += `**Total Messages:** ${messages.length}\n`;
	formattedText += `**Exported:** ${new Date().toLocaleString()}\n\n`;
	formattedText += `---\n\n`;

	// Group consecutive messages from same sender (Unknown = continuation of previous sender)
	let lastKnownSender = '';
	for (const msg of messages) {
		const isUnknown = msg.username === 'Unknown';
		const isSameSender = isUnknown || msg.username === lastKnownSender;

		if (isSameSender && lastKnownSender) {
			// Continue previous sender's block - just add timestamp and content
			formattedText += `*${msg.timestamp}*\n${msg.content}\n\n`;
		} else {
			// New sender - start a new block with separator
			if (lastKnownSender) {
				formattedText += `---\n\n`;
			}
			formattedText += `### ${msg.username}\n*${msg.timestamp}*\n\n${msg.content}\n\n`;
			if (!isUnknown) {
				lastKnownSender = msg.username;
			}
		}
	}

	if (output === 'file') {
		// Create and download the file
		const blob = new Blob([formattedText], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;

		const safeChannelName = channelName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		const dateStr = new Date().toISOString().split('T')[0];
		link.download = `slack_export_${safeChannelName}_${dateStr}.md`;

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} else {
		// Copy to clipboard
		await navigator.clipboard.writeText(formattedText);
	}

	return {
		count: messages.length,
		messages: messages,
		text: formattedText,
	};
};

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

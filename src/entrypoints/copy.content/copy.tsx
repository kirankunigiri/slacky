/**
 * Work in progress...
 * Automatically scrolls through the messages in a channel/thread to extract all messages
 * Scrolling is used because the message lists are virtualized
 */

export const copyMessages = async () => {
	console.log('🔄 Starting message extraction...');

	document.body.click();

	const allMessages = new Map();

	// Find the scrollable hider element
	const messageContainer = document.querySelector('.p-threads_flexpane_container .c-scrollbar__hider');
	// let messageContainer = document.querySelector('#message-list .c-scrollbar__hider');

	// if (!messageContainer) {
	// 	messageContainer = document.querySelector('.c-message_list .c-scrollbar__hider');
	// }

	if (!messageContainer) {
		console.error('❌ Could not find scrollbar hider');
		return;
	}

	console.log('✅ Found scrollable container');
	console.log('📏 Scroll height:', messageContainer.scrollHeight);
	console.log('📏 Client height:', messageContainer.clientHeight);
	console.log('📏 Max scroll:', messageContainer.scrollHeight - messageContainer.clientHeight);

	const maxScroll = messageContainer.scrollHeight - messageContainer.clientHeight;

	// Function to extract messages
	function extractVisibleMessages() {
		const messageElements = messageContainer.querySelectorAll('[data-qa="virtual-list-item"]');
		let newCount = 0;

		messageElements.forEach((element) => {
			try {
				const contentElement = element.querySelector('[data-qa="message-text"]');
				if (!contentElement) return;

				const content = contentElement.innerText.trim();
				if (!content) return;

				// Look for the timestamp link (it's in a <a> tag with class c-timestamp)
				let timestamp = '';
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

					// Get data-ts for unique ID
					timestamp = timestampLink.getAttribute('data-ts');
				}

				// Fallback: try the old selector
				if (displayTime === 'No timestamp') {
					const timeElement = element.querySelector('[data-qa="message_timestamp"]');
					if (timeElement) {
						displayTime = timeElement.getAttribute('aria-label')
						  || timeElement.innerText.trim();
						timestamp = timeElement.getAttribute('data-ts');
					}
				}

				const itemKey = element.getAttribute('data-item-key')
				  || `${timestamp}_${content.substring(0, 100)}`;

				if (allMessages.has(itemKey)) return;

				const usernameElement = element.querySelector('[data-qa="message_sender"]');
				let username = 'Unknown';

				if (usernameElement) {
					username = usernameElement.innerText.trim();
				} else {
					// Fallback to other username selectors
					const altUsername = element.querySelector('.c-message__sender');
					if (altUsername) {
						username = altUsername.innerText.trim();
					}
				}

				allMessages.set(itemKey, {
					username,
					timestamp: displayTime,
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
	console.log('\n📍 Scrolling to bottom...');
	messageContainer.scrollTop = maxScroll;
	await new Promise(resolve => setTimeout(resolve, 1000));

	// Extract initial messages
	let newMessages = extractVisibleMessages();
	console.log(`📥 Found ${newMessages} initial messages\n`);

	// Scroll UP through history
	console.log('📜 Scrolling UP through message history...\n');

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

		newMessages = extractVisibleMessages();
		if (newMessages > 0) {
			console.log(`📥 +${newMessages} | Total: ${allMessages.size}`);
		}

		if (afterScroll <= 5) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			extractVisibleMessages();
			break;
		}

		iterations++;
	}

	console.log(`\n✅ Extraction complete! Found ${allMessages.size} messages\n`);

	// Format messages
	const messages = Array.from(allMessages.values()).sort((a, b) => a.timestamp - b.timestamp);

	const channelName = document.querySelector('[data-qa="channel_name"]')?.innerText
	  || document.title.split(' - ')[0]
	  || 'Slack Channel';

	let formattedText = `Slack Channel Export\n`;
	formattedText += `Channel: ${channelName}\n`;
	formattedText += `Total Messages: ${messages.length}\n`;
	formattedText += `Exported: ${new Date().toLocaleString()}\n\n`;
	formattedText += `${'='.repeat(70)}\n\n`;

	formattedText += messages.map(msg =>
		`${msg.username} - ${msg.timestamp}\n${msg.content}\n`,
	).join(`\n${'-'.repeat(70)}\n\n`);

	// Create and download the file
	console.log('💾 Creating download...');

	const blob = new Blob([formattedText], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;

	const safeChannelName = channelName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
	const dateStr = new Date().toISOString().split('T')[0];
	link.download = `slack_export_${safeChannelName}_${dateStr}.txt`;

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);

	console.log(`\n✅ Download started!`);
	console.log(`📁 Filename: ${link.download}`);
	console.log(`📊 File size: ${(formattedText.length / 1024).toFixed(2)} KB`);

	console.log(`\n📊 Summary:`);
	console.log(`   Channel: ${channelName}`);
	console.log(`   Total messages: ${messages.length}`);
	console.log(`   Iterations: ${iterations}`);

	// Show sample messages with timestamps
	console.log(`\n📋 Sample messages with timestamps:`);
	messages.slice(0, 5).forEach((msg, i) => {
		console.log(`${i + 1}. ${msg.username} - ${msg.timestamp}`);
		console.log(`   ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}`);
		console.log('');
	});

	return {
		count: messages.length,
		messages: messages,
		text: formattedText,
	};
};

export function CopyButton() {
	const handleClick = async () => {
		console.log('Copying messages...');
		copyMessages();
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
			<div style={{ width: '20px', height: '20px', display: 'inline-block' }}>
				<svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M36.4 56.2C36.4 63.5 30.5 69.4 23.2 69.4C15.9 69.4 10 63.5 10 56.2C10 48.9 15.9 43 23.2 43H36.4V56.2Z" fill="#E01E5A" />
					<path d="M23.2 36.4C15.9 36.4 10 30.5 10 23.2C10 15.9 15.9 10 23.2 10C30.5 10 36.4 15.9 36.4 23.2V36.4H23.2Z" fill="#36C5F0" />
					<path d="M43 23.2C43 15.9 48.9 10 56.2 10C63.5 10 69.4 15.9 69.4 23.2C69.4 30.5 63.5 36.4 56.2 36.4H43V23.2Z" fill="#2EB67D" />
					<path d="M56.2 43C63.5 43 69.4 48.9 69.4 56.2C69.4 63.5 63.5 69.4 56.2 69.4C48.9 69.4 43 63.5 43 56.2V43H56.2Z" fill="#ECB22E" />
				</svg>
			</div>
		</button>
	);
}

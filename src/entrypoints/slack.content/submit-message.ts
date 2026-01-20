import { onMessage } from '@/utils/messaging';
import { loadStorage, settings$ } from '@/utils/store';

/**
 * Waits for an element to appear on the page with a timeout
 * @param selector - CSS selector for the element
 * @param options - Configuration options
 * @param options.timeout - Maximum time to wait in milliseconds (default: 10000ms)
 * @param options.interval - How often to check for the element in milliseconds (default: 100ms)
 * @param options.condition - Optional additional condition the element must satisfy
 * @returns The found element
 * @throws Error if element is not found within timeout
 */
async function waitForElement<T extends HTMLElement>(
	selector: string,
	options: {
		timeout?: number
		interval?: number
		condition?: (element: T) => boolean
	} = {},
): Promise<T> {
	const { timeout = 10000, interval = 100, condition } = options;
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		console.log('Waiting for element:', selector);
		const element = document.querySelector(selector) as T;
		if (element && (!condition || condition(element))) {
			return element;
		}
		await new Promise(resolve => setTimeout(resolve, interval));
	}

	throw new Error(`Element "${selector}" not found within ${timeout}ms`);
}

async function submitSlackMessage() {
	onMessage('submitSlackMessage', async (message) => {
		await loadStorage();
		const autoSubmitPrMessage = settings$.auto_submit_pr_message.get();

		// Handle slack_message type from background script
		try {
			// Find the Slack message input field (wait up to 10s for it to appear)
			const messageInput = await waitForElement<HTMLElement>('[data-qa="message_input"]');

			// Focus the input
			messageInput.click();

			// Docs: https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
			// Replace text with new message
			document.execCommand('selectAll', false);
			document.execCommand('insertText', false, message.data.text);

			// Wait for send button to be enabled, then send
			if (autoSubmitPrMessage) {
				const sendButton = await waitForElement<HTMLElement>('[data-qa="texty_send_button"]', {
					condition: btn => btn.getAttribute('aria-disabled') !== 'true',
				});
				sendButton.click();
			}
		} catch (error) {
			console.error('Error sending message:', error);
			return false;
		}

		// Return true to indicate we'll send response asynchronously
		return true;
	});
}

export default submitSlackMessage;

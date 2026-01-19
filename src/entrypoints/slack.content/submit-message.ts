import { onMessage } from '@/utils/messaging';

function submitSlackMessage() {
	console.log('Setup listener for messages from background script');
	onMessage('submitSlackMessage', (message) => {
		console.log('Received Message:', message);

		// Handle slack_message type from background script
		try {
			// Find the Slack message input field
			const messageInput = document.querySelector('[data-qa="message_input"]') as HTMLElement;

			if (!messageInput) {
				console.error('Slack message input not found');
				return false;
			}

			// Focus the input
			messageInput.click();

			// Insert the text
			document.execCommand('insertText', false, message.data.text);

			// Wait a brief moment for Slack to process the text, then send
			// TODO: Instead of timeout, wait for aria-disabled="true" to be removed from the button
			setTimeout(() => {
				const sendButton = document.querySelector('[data-qa="texty_send_button"]') as HTMLElement;

				if (sendButton) {
					sendButton.click();
					return true;
				} else {
					console.error('Send button not found');
					return true;
				}
			}, 100);
		} catch (error) {
			console.error('Error sending message:', error);
			return false;
		}

		// Return true to indicate we'll send response asynchronously
		return true;
	});
}

export default submitSlackMessage;

import { settings$ } from '@/utils/store';

/** Removes embed links from Slack messages */
export const removeEmbeds = () => {
	// Function to process a message attachment and delete if it contains a GitHub link
	async function processAttachment(attachment: Element) {
		// Find the first link inside the attachment
		const link = attachment.querySelector('a');
		if (!link) return;

		const href = link.getAttribute('href') || '';
		await loadSettings();
		const removeAllEmbedLinks = settings$.removeAllEmbedLinks.get();
		const embedLinkFilters = settings$.embedLinkFilters.get();

		if (!removeAllEmbedLinks && !embedLinkFilters.some(filter => href.toLowerCase().includes(filter.toLowerCase()))) {
			return;
		}

		// Find the delete button inside this attachment
		const deleteButton = attachment.querySelector('.c-message_attachment__delete') as HTMLButtonElement | null;
		if (deleteButton) {
			deleteButton.click();
		}
	}

	// Function to click the confirmation Remove button in modal
	function clickConfirmButton(confirmButton: HTMLButtonElement) {
		if (settings$.autoConfirmEmbedRemoval.get()) {
			confirmButton.click();
		}
	}

	// Check all existing attachments on page load
	function checkExistingAttachments() {
		const existingAttachments = document.querySelectorAll('.c-message_attachment');
		existingAttachments.forEach(processAttachment);
	}

	// Set up MutationObserver to watch for new attachments and confirmation modals
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				// Check if the added node is an element
				if (node.nodeType === Node.ELEMENT_NODE) {
					const element = node as Element;

					// Check if it's an attachment itself
					if (element.classList?.contains('c-message_attachment')) {
						processAttachment(element);
					}

					// Check if it's the confirmation button itself
					if (element.getAttribute?.('data-qa') === 'dialog_go') {
						clickConfirmButton(element as HTMLButtonElement);
					}

					// Also check for attachments within the added node
					const attachments = element.querySelectorAll?.('.c-message_attachment');
					attachments?.forEach(processAttachment);

					// Also check for confirmation buttons within the added node
					const confirmButtons = element.querySelectorAll?.('[data-qa="dialog_go"]') as NodeListOf<HTMLButtonElement>;
					confirmButtons?.forEach(clickConfirmButton);
				}
			});
		});
	});

	// Start observing when DOM is ready
	if (document.body) {
		checkExistingAttachments();
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	} else {
		// If body isn't ready yet, wait for it
		document.addEventListener('DOMContentLoaded', () => {
			checkExistingAttachments();
			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
		});
	}
};

/**
 * Remove attachment button - .c-message_attachment__delete
 * <button class="c-button-unstyled c-message_attachment__delete" data-qa="message_attachment_delete_button" aria-label="Remove attachment" type="button"><i class="c-deprecated-icon c-icon--times-small undefined" data-qa="slack_kit_icon" type="times_small" aria-hidden="true"></i></button>
 */

/**
 * Confirmation Remove button in modal - [data-qa="dialog_go"]
 * <button class="c-button--focus-visible c-button c-button--danger c-button--medium c-dialog__go" data-qa="dialog_go" aria-label="Remove" type="button">Remove</button>
 */

/**
 * Message div - .c-message_kit__message
 * <div role="presentation" class="c-message_kit__background p-message_pane_message__message c-message_kit__message" data-qa="message_container" data-qa-unprocessed="false" data-qa-placeholder="false" data-msg-ts="1765505499.805759" data-msg-channel-id="C015P7H6A2K"><div role="document" aria-roledescription="message" class="c-message_kit__hover toggl" data-qa-hover="true"><div class="c-message_kit__actions c-message_kit__actions--above" style="position: relative;"></div>
 */

/**
 * Message attachment div - .c-message_attachment__title_link
 * <a target="_blank" class="c-link c-message_attachment__title_link" data-qa="message_attachment_title_link" href="https://github.com/wxt-dev/wxt/discussions/1314" rel="noopener noreferrer"><span dir="auto">Installing the extension on existing Chrome window? · wxt-dev wxt · Discussion #1314</span><span aria-label="(opens in new tab)" data-qa="opens-in-new-tab"></span></a>
 */

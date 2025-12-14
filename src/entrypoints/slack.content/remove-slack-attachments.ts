export const removeSlackAttachments = () => {
	// Function to click a delete button
	function clickDeleteButton(deleteButton: HTMLButtonElement) {
		console.log('Found delete button, clicking...');
		deleteButton.click();
	}

	// Function to click the confirmation Remove button in modal
	function clickConfirmButton(confirmButton: HTMLButtonElement) {
		console.log('Found confirmation Remove button, clicking...');
		confirmButton.click();
	}

	// Check all existing delete buttons on page load
	function checkExistingDeleteButtons() {
		const existingButtons = document.querySelectorAll('.c-message_attachment__delete') as NodeListOf<HTMLButtonElement>;
		existingButtons.forEach(clickDeleteButton);
		console.log(`Clicked ${existingButtons.length} existing delete buttons.`);
	}

	// Set up MutationObserver to watch for new delete buttons and confirmation modals
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				// Check if the added node is an element
				if (node.nodeType === Node.ELEMENT_NODE) {
					const element = node as Element;

					// Check if it's a delete button itself
					if (element.classList?.contains('c-message_attachment__delete')) {
						clickDeleteButton(element as HTMLButtonElement);
					}

					// Check if it's the confirmation button itself
					if (element.getAttribute?.('data-qa') === 'dialog_go') {
						clickConfirmButton(element as HTMLButtonElement);
					}

					// Also check for delete buttons within the added node
					const deleteButtons = element.querySelectorAll?.('.c-message_attachment__delete') as NodeListOf<HTMLButtonElement>;
					deleteButtons?.forEach(clickDeleteButton);

					// Also check for confirmation buttons within the added node
					const confirmButtons = element.querySelectorAll?.('[data-qa="dialog_go"]') as NodeListOf<HTMLButtonElement>;
					confirmButtons?.forEach(clickConfirmButton);
				}
			});
		});
	});

	// Start observing when DOM is ready
	if (document.body) {
		checkExistingDeleteButtons();
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
		console.log('MutationObserver started - watching for delete buttons and confirmation modals.');
	} else {
		// If body isn't ready yet, wait for it
		document.addEventListener('DOMContentLoaded', () => {
			checkExistingDeleteButtons();
			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
			console.log('MutationObserver started after DOMContentLoaded - watching for delete buttons and confirmation modals.');
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

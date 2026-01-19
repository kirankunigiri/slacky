import { sendMessage } from '@/utils/messaging';
import { featureUsageCounts$, loadStorage, settings$ } from '@/utils/store';

/** Checks if a URL's hostname matches a domain filter (including subdomains) */
const matchesDomainFilter = (href: string, filter: string): boolean => {
	try {
		const url = new URL(href);
		const hostname = url.hostname.toLowerCase();
		const filterDomain = filter.toLowerCase();

		// Exact match or subdomain match (e.g., "api.github.com" matches filter "github.com")
		return hostname === filterDomain || hostname.endsWith(`.${filterDomain}`);
	} catch {
		// Invalid URL, no match
		return false;
	}
};

// Track whether we initiated the removal (vs user manually clicking delete)
let extensionInitiatedRemoval = false;

/** Removes embed links from Slack messages */
const removeEmbeds = () => {
	// Track which confirm buttons we've already processed to avoid duplicate events for tracking
	const processedConfirmButtons = new WeakSet<HTMLButtonElement>();

	// Function to process a message attachment and delete if it contains a GitHub link
	async function processAttachment(attachment: Element) {
		// Find the first link inside the attachment
		const link = attachment.querySelector('a');
		if (!link) return;

		const href = link.getAttribute('href') || '';
		await loadStorage();
		const removeAllEmbedLinks = settings$.remove_all_embed_links.get();
		const embedLinkFilters = settings$.embed_link_filters.get().filter(filter => filter !== '');

		const matchedFilter = embedLinkFilters.find(filter => matchesDomainFilter(href, filter));
		if (!removeAllEmbedLinks && !matchedFilter) {
			return;
		}

		// Find the delete button inside this attachment
		const deleteButton = attachment.querySelector('.c-message_attachment__delete') as HTMLButtonElement | null;
		if (deleteButton) {
			extensionInitiatedRemoval = true;
			deleteButton.click();

			// Track embed removal
			try {
				const url = new URL(href);
				featureUsageCounts$.remove_embeds.set(v => v + 1);
				sendMessage('trackEvent', {
					eventName: 'embed_link_removed',
					eventProperties: {
						url: href,
						domain: url.hostname,
						setting_used: removeAllEmbedLinks ? 'remove_all_embed_links' : 'embed_link_filters',
					},
				});
			} catch { /* empty */ }
		}
	}

	// Function to click the confirmation Remove button in modal
	function clickConfirmButton(confirmButton: HTMLButtonElement) {
		// Auto-confirm if extension initiated the removal, or if autoConfirmEmbedRemoval is enabled for manual removals
		if (extensionInitiatedRemoval || settings$.auto_confirm_embed_removal.get()) {
			confirmButton.click();

			// Track when user manually clicked delete and auto-confirm kicked in
			if (!extensionInitiatedRemoval) {
				featureUsageCounts$.auto_confirm_embed_removal.set(v => v + 1);
				sendMessage('trackEvent', {
					eventName: 'auto_confirmed_embed_removal',
				});
			}

			extensionInitiatedRemoval = false; // Reset flag after confirming
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

					// Also check for attachments within the added node
					const attachments = element.querySelectorAll?.('.c-message_attachment');
					attachments?.forEach(processAttachment);

					// Check if element is the "Remove preview?" modal or contains it
					const isDirectMatch = element.matches?.('div[aria-label="Remove preview?"]');
					const modals = isDirectMatch
						? [element]
						: Array.from(element.querySelectorAll?.('div[aria-label="Remove preview?"]') ?? []);
					for (const modal of modals) {
						const confirmButton = modal.querySelector('[data-qa="dialog_go"]') as HTMLButtonElement | null;
						if (confirmButton && !processedConfirmButtons.has(confirmButton)) {
							processedConfirmButtons.add(confirmButton);
							clickConfirmButton(confirmButton);
						}
					}
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

export default removeEmbeds;

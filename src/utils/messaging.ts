import { defineProxyService } from '@webext-core/proxy-service';

import { trackEvent, TrackEventArgs } from './analytics';

class BackgroundService {
	trackEvent(params: TrackEventArgs) {
		trackEvent(params);
	}

	/**
	 * Opens the settings popup.
	 * Some browsers like Firefox don't allow opening a popup from
	 * a content script button, so the options page is used as a fallback.
	 */
	async openPopup() {
		let page: 'popup' | 'options' = 'popup';
		try {
			await browser.action.openPopup();
		} catch (error) {
			await browser.runtime.openOptionsPage();
			page = 'options';
			console.error('Failed to open popup:', error);
		} finally {
			trackEvent({ eventName: 'slacky_button_clicked', eventProperties: { page } });
		}
	}
}

export const [registerBackgroundService, getBackgroundService] = defineProxyService(
	'BackgroundService',
	() => new BackgroundService(),
);

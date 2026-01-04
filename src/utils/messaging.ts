import { defineProxyService } from '@webext-core/proxy-service';

import { trackEvent, TrackEventArgs } from './analytics';

class BackgroundService {
	trackEvent(params: TrackEventArgs) {
		trackEvent(params);
	}

	openPopup() {
		browser.action.openPopup();
		trackEvent({ eventName: 'slacky_button_clicked' });
	}
}

export const [registerBackgroundService, getBackgroundService] = defineProxyService(
	'BackgroundService',
	() => new BackgroundService(),
);

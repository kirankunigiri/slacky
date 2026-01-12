import { defineProxyService } from '@webext-core/proxy-service';

import { trackEvent, TrackEventArgs } from './analytics';

class BackgroundService {
	trackEvent(params: TrackEventArgs) {
		trackEvent(params);
	}
}

export const [registerBackgroundService, getBackgroundService] = defineProxyService(
	'BackgroundService',
	() => new BackgroundService(),
);

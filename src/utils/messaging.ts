import { trackEvent, type TrackEventArgs } from './analytics';

/**
 * Background service implementation
 * This file imports analytics and should only be imported by the background script
 */
class BackgroundService {
	trackEvent(params: TrackEventArgs) {
		trackEvent(params);
	}
}

export const createBackgroundService = () => new BackgroundService();

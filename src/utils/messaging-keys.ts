import { defineProxyService } from '@webext-core/proxy-service';

import type { TrackEventArgs } from './analytics';

/**
 * Service interface for background service
 * This file should only contain type imports to avoid bundling implementation code in content scripts
 */
interface IBackgroundService {
	trackEvent(params: TrackEventArgs): void
}

/**
 * Define the proxy service
 * The init function accepts the service instance as a parameter, so the background
 * can pass the real implementation when registering
 */
export const [registerBackgroundService, getBackgroundService] = defineProxyService<IBackgroundService, [IBackgroundService]>(
	'BackgroundService',
	service => service,
);

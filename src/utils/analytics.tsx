import 'posthog-js/dist/web-vitals';
import 'posthog-js/dist/posthog-recorder';
import 'posthog-js/dist/exception-autocapture';
import 'posthog-js/dist/dead-clicks-autocapture';

import { PostHog, PostHogConfig } from 'posthog-js/dist/module.full.no-external';
import { PostHogErrorBoundary, PostHogProvider } from 'posthog-js/react';
import { v7 as uuidv7 } from 'uuid';

/**
 * Setup analytics using PostHog
 * Docs: https://posthog.com/docs/advanced/browser-extension
 */

/** React provider for PostHog */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
	if (import.meta.env.DEV && import.meta.env.VITE_DEV_ENABLE_ANALYTICS !== 'true') {
		console.log('Analytics disabled in development');
		return children;
	}

	const posthog = new PostHog();
	setupPostHog({ posthog, type: 'ui' });

	return (
		// @ts-expect-error - PostHogProvider is not type compatible with PostHog client from module.no-external
		<PostHogProvider client={posthog}>
			<PostHogErrorBoundary>
				{children}
			</PostHogErrorBoundary>
		</PostHogProvider>
	);
}

type PostHogClientType = 'ui' | 'background';

// TODO: Is import.meta.env available in background scripts?
const basePostHogOptions: Partial<PostHogConfig> = {
	api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
	defaults: '2025-11-30',
	debug: import.meta.env.DEV && import.meta.env.VITE_DEV_ENABLE_ANALYTICS_LOGGING === 'true',
	disable_external_dependency_loading: true,
	persistence: 'localStorage',
	disable_surveys: true,
	capture_exceptions: {
		capture_unhandled_errors: true,
		capture_unhandled_rejections: true,
		capture_console_errors: true,
	},
	error_tracking: {
		captureExtensionExceptions: true,
	},
};

/** Used for the popup and options pages */
const uiPostHogOptions: Partial<PostHogConfig> = {
	...basePostHogOptions,
	session_recording: {
		maskAllInputs: false,
	},
};

/** Used for the background script. Content scripts (injected into Slack) don't use PostHog directly - they send a message to the background script to track events. */
const backgroundPostHogOptions: Partial<PostHogConfig> = {
	...basePostHogOptions,
	autocapture: false,
	disable_session_recording: true,
	capture_dead_clicks: false,
	capture_pageview: false,
	capture_pageleave: false,
	capture_heatmaps: false,
};

/** Setup PostHog for the given client type */
const setupPostHog = async ({
	posthog,
	type,
}: {
	posthog: PostHog
	type: PostHogClientType
}) => {
	const userInfo = await getUserInfo();
	posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
		...(type === 'ui' ? uiPostHogOptions : backgroundPostHogOptions),
		bootstrap: {
			distinctID: userInfo.userId,
		},
		person_profiles: 'always',
	});
	if (userInfo.isDevUser) {
		posthog.setPersonProperties(undefined, {
			is_dev_user: true,
		});
	}
};

interface UserInfo {
	userId: string
	isDevUser: boolean
}

/**
 * Get user id and dev user status
 * Dev users are identified by a prefix in the user id
 */
const getUserInfo = async (): Promise<UserInfo> => {
	let isDevUser = false;
	const stored = await browser.storage.local.get<{ userId: string }>('userId');
	if (stored.userId) {
		return {
			userId: stored.userId,
			isDevUser: stored.userId.startsWith('dev_'),
		};
	}

	let devUsernamePrefix = '';
	if (import.meta.env.MODE === 'development') {
		isDevUser = true;
		const analyticsUsername = import.meta.env.VITE_DEV_ANALYTICS_USERNAME;
		devUsernamePrefix = analyticsUsername
			? `dev_${analyticsUsername}_`
			: 'dev_';
	}

	const userId = `${devUsernamePrefix}${uuidv7()}`;
	await browser.storage.local.set({ userId: userId });
	return { userId, isDevUser };
};

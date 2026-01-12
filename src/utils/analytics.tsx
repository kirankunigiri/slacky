import 'posthog-js/dist/web-vitals';
import 'posthog-js/dist/posthog-recorder';
import 'posthog-js/dist/exception-autocapture';
import 'posthog-js/dist/dead-clicks-autocapture';

import { PostHog, PostHogConfig } from 'posthog-js/dist/module.full.no-external';
import { PostHogErrorBoundary, PostHogProvider } from 'posthog-js/react';
import { v7 as uuidv7 } from 'uuid';

import { clientEnv as env } from '@/utils/client-env';
import { defaultSettingsPropertiesWithTheme } from '@/utils/store';

/**
 * Setup analytics using PostHog
 * Docs: https://posthog.com/docs/advanced/browser-extension
 */

export const ph = new PostHog();
const missingPostHogCredentials = !env.VITE_PUBLIC_POSTHOG_HOST || !env.VITE_PUBLIC_POSTHOG_KEY;
const disableAnalytics = missingPostHogCredentials || import.meta.env.VITE_IS_TEST_BUILD === 'true' || (import.meta.env.DEV && !env.VITE_DEV_ENABLE_ANALYTICS);
if (!disableAnalytics) {
	const scriptType = typeof document !== 'undefined' ? 'ui' : 'background';
	setupPostHog({ posthog: ph, type: scriptType });
}

/** React provider for PostHog */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
	if (disableAnalytics) {
		console.log('Analytics disabled');
		return (
			<ErrorFallback>
				{children}
			</ErrorFallback>
		);
	}

	return (
		// @ts-expect-error - PostHogProvider is not type compatible with PostHog client from module.no-external
		<PostHogProvider client={ph}>
			<ErrorFallback>
				{children}
			</ErrorFallback>
		</PostHogProvider>
	);
}

function ErrorFallback({ children }: { children: React.ReactNode }) {
	return (
		<PostHogErrorBoundary fallback={(
			<div className="p-4 text-center">
				<span className="text-red-500">Slacky has crashed.</span>
				<br />
				<a
					className="hover:underline"
					href="https://github.com/kirankunigiri/slacky/issues/new/choose"
					target="_blank"
					rel="noreferrer"
				>
					Please file an issue on{' '}
					<span className="text-blue-500">GitHub</span>
				</a>
			</div>
		)}
		>
			{children}
		</PostHogErrorBoundary>
	);
}

type PostHogClientType = 'ui' | 'background';

// TODO: Is import.meta.env available in background scripts?
const basePostHogOptions: Partial<PostHogConfig> = {
	api_host: env.VITE_PUBLIC_POSTHOG_HOST,
	defaults: '2025-11-30',
	debug: import.meta.env.DEV && env.VITE_DEV_ENABLE_ANALYTICS_LOGGING,
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
async function setupPostHog({
	posthog,
	type,
}: {
	posthog: PostHog
	type: PostHogClientType
}) {
	const userInfo = await getUserInfo();
	posthog.init(env.VITE_PUBLIC_POSTHOG_KEY!, {
		...(type === 'ui' ? uiPostHogOptions : backgroundPostHogOptions),
		bootstrap: {
			distinctID: userInfo.userId,
		},
		person_profiles: 'always',
	});

	// Set initial person properties
	if (userInfo.isNewUser) {
		// dev user property - set_once
		if (userInfo.isDevUser) {
			posthog.setPersonProperties(undefined, {
				is_dev_user: true,
			});
		}

		// default settings properties - set
		posthog.setPersonProperties(defaultSettingsPropertiesWithTheme);
	}
};

interface UserInfo {
	userId: string
	isDevUser: boolean
	isNewUser: boolean
}

/**
 * Get user id and dev user status
 * Dev users are identified by a prefix in the user id
 */
async function getUserInfo(): Promise<UserInfo> {
	let isDevUser = false;
	const stored = await browser.storage.local.get<{ userId: string }>('userId');
	if (stored.userId) {
		return {
			userId: stored.userId,
			isDevUser: stored.userId.startsWith('dev_'),
			isNewUser: false,
		};
	}

	let devUsernamePrefix = '';
	if (import.meta.env.MODE === 'development') {
		isDevUser = true;
		const analyticsUsername = env.VITE_DEV_ANALYTICS_USERNAME;
		devUsernamePrefix = analyticsUsername
			? `dev_${analyticsUsername}_`
			: 'dev_';
	}

	const userId = `${devUsernamePrefix}${uuidv7()}`;
	await browser.storage.local.set({ userId: userId });
	return { userId, isDevUser, isNewUser: true };
};

// Types for all trackable events
// Each event type specifies its required eventProperties and userProperties
interface SettingUpdatedEvent {
	eventName: 'setting_updated'
	eventProperties: {
		setting: string
		value: unknown
	}
	userProperties: Record<`setting_${string}`, unknown>
}

interface SettingsResetEvent {
	eventName: 'settings_reset'
	eventProperties?: undefined
	userProperties: Record<`setting_${string}`, unknown>
}

/** Links clicked in the footer */
interface LinkClickedEvent {
	eventName: 'link_clicked'
	eventProperties: {
		type: 'new_github_issue' | 'author' | 'tutorial'
	}
	userProperties?: undefined
}

interface SlackyButtonClickedEvent {
	eventName: 'slacky_button_clicked'
	eventProperties: {
		page: 'popup' | 'options'
	}
	userProperties?: undefined
}

interface MessagesExportedEvent {
	eventName: 'messages_exported'
	eventProperties: {
		type: 'channel' | 'thread'
		exportFormat: Exclude<MessageExportFormat, 'disabled'>
		message_count: number
		export_duration: number
	}
	userProperties?: undefined
}

interface SkippedAppRedirectEvent {
	eventName: 'skipped_app_redirect'
	eventProperties?: undefined
	userProperties?: undefined
}

interface EmbedLinkRemovedEvent {
	eventName: 'embed_link_removed'
	eventProperties: {
		url: string
		domain: string
		setting_used: 'remove_all_embed_links' | 'embed_link_filters'
	}
	userProperties?: undefined
}

interface AutoConfirmedEmbedRemovalEvent {
	eventName: 'auto_confirmed_embed_removal'
	eventProperties?: undefined
	userProperties?: undefined
}

// Merged trackable events type
export type TrackEventArgs = SettingUpdatedEvent
	| SettingsResetEvent
	| SlackyButtonClickedEvent
	| LinkClickedEvent
	| MessagesExportedEvent
	| EmbedLinkRemovedEvent
	| SkippedAppRedirectEvent
	| AutoConfirmedEmbedRemovalEvent;

/**
 * Type-safe event tracking wrapper for PostHog
 * Based on eventName, enforce the correct properties
 */
export const trackEvent = (args: TrackEventArgs) => {
	const { eventName, eventProperties, userProperties } = args;
	ph.capture(eventName, {
		...eventProperties,
		...(userProperties && { $set: userProperties }),
	});
};

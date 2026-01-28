import { observable, syncState, when } from '@legendapp/state';
import { synced } from '@legendapp/state/sync';

import { storage } from '#imports';

export type MessageExportFormat = 'clipboard' | 'markdown_file' | 'disabled';
export type RemoveEmbedLinkMode = 'off' | 'all' | 'filter';
export interface SlackChannel {
	url: string
	name: string
	default: boolean
}

// Default template string used in PR messages
export const DEFAULT_PR_TEMPLATE = '{{github_url}} - {{title}} (+{{linesAdded}} / -{{linesRemoved}})';

/** Settings stored in Chrome storage */
export interface Settings {
	remove_embed_link_mode: RemoveEmbedLinkMode
	embed_link_filters: string[]
	auto_confirm_embed_removal: boolean
	open_slack_links_in_browser: boolean
	message_export_format: MessageExportFormat
	show_settings_button_in_slack: boolean

	// PR Message settings
	copy_pr_message: boolean
	enable_send_pr_message: boolean
	auto_submit_pr_message: boolean
	pr_message_channels: SlackChannel[]
	pr_message_template: string
}

export const defaultSettings = {
	remove_embed_link_mode: 'off',
	embed_link_filters: [],
	auto_confirm_embed_removal: true,
	open_slack_links_in_browser: true,
	message_export_format: 'clipboard',
	show_settings_button_in_slack: true,

	// PR Message settings
	copy_pr_message: true,
	enable_send_pr_message: false,
	auto_submit_pr_message: false,
	pr_message_channels: [],
	pr_message_template: DEFAULT_PR_TEMPLATE,
} as const satisfies Settings;

export const defaultSettingsProperties = Object.fromEntries(
	Object.entries(defaultSettings).map(([key, value]) => [`setting_${key}`, value]),
) as Record<`setting_${keyof Settings}`, Settings[keyof Settings]>;

export const defaultSettingsPropertiesWithTheme = {
	...defaultSettingsProperties,
	setting_theme: 'dark' as 'dark' | 'light',
};

export const SETTINGS_STORAGE_KEY = 'local:settings' as const;

export const settings$ = observable<Settings>(
	synced({
		initial: defaultSettings,

		// Get settings from WXT storage
		get: async () => {
			const value = await storage.getItem(SETTINGS_STORAGE_KEY);
			if (value) {
				try {
					const stored = JSON.parse(value as string) as Partial<Settings>;
					return { ...defaultSettings, ...stored };
				} catch {
					return defaultSettings;
				}
			}
			return defaultSettings;
		},

		// Save settings to WXT storage
		set: async ({ value }) => {
			await storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
		},

		// Subscribe to changes from other tabs using WXT storage.watch
		// refresh() re-runs get() to fetch latest
		subscribe: ({ refresh }) => {
			return storage.watch<string>(SETTINGS_STORAGE_KEY, () => refresh());
		},
	}),
);

// Track feature usage count
// remove_embed_link_mode and embed_link_filters is merged into a single feature count - remove_embeds
// copy_pr_message, send_pr_message, pr_message_channels, enable_send_pr_message, auto_submit_pr_message is merged into a single feature count - pr_message
export type FeatureUsageCounts = {
	[K in keyof Omit<Settings, 'show_settings_button_in_slack' | 'remove_embed_link_mode' | 'embed_link_filters' | 'copy_pr_message' | 'pr_message_channels' | 'pr_message_template' | 'enable_send_pr_message' | 'auto_submit_pr_message'>]: number;
} & {
	remove_embeds: number
	pr_message: number
};

const defaultFeatureUsageCounts: FeatureUsageCounts = {
	open_slack_links_in_browser: 0,
	auto_confirm_embed_removal: 0,
	message_export_format: 0,
	remove_embeds: 0,
	pr_message: 0,
};

const FEATURE_USAGE_STORAGE_KEY = 'local:featureUsageCounts' as const;

export const featureUsageCounts$ = observable<FeatureUsageCounts>(
	synced({
		initial: defaultFeatureUsageCounts,

		get: async () => {
			const value = await storage.getItem(FEATURE_USAGE_STORAGE_KEY);
			if (value) {
				try {
					const stored = JSON.parse(value as string) as Partial<FeatureUsageCounts>;
					return { ...defaultFeatureUsageCounts, ...stored };
				} catch {
					return defaultFeatureUsageCounts;
				}
			}
			return defaultFeatureUsageCounts;
		},

		set: async ({ value }) => {
			await storage.setItem(FEATURE_USAGE_STORAGE_KEY, JSON.stringify(value));
		},

		subscribe: ({ refresh }) => {
			return storage.watch<string>(FEATURE_USAGE_STORAGE_KEY, () => refresh());
		},
	}),
);

export const loadStorage = async () => {
	featureUsageCounts$.get();
	settings$.get();

	const featureUsageCountsStatus$ = syncState(featureUsageCounts$);
	const settingsStatus$ = syncState(settings$);

	await Promise.all([
		when(featureUsageCountsStatus$.isLoaded),
		when(settingsStatus$.isLoaded),
	]);
};

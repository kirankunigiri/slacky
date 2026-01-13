import { observable, syncState, when } from '@legendapp/state';
import { synced } from '@legendapp/state/sync';

import { trackEvent } from '@/utils/analytics';
import { storage } from '#imports';

export type MessageExportFormat = 'clipboard' | 'markdown_file' | 'disabled';

/** Settings stored in Chrome storage */
interface Settings {
	remove_all_embed_links: boolean
	embed_link_filters: string[]
	auto_confirm_embed_removal: boolean
	open_slack_links_in_browser: boolean
	message_export_format: MessageExportFormat
	show_settings_button_in_slack: boolean
}

export const defaultSettings = {
	remove_all_embed_links: false,
	embed_link_filters: [],
	auto_confirm_embed_removal: true,
	open_slack_links_in_browser: true,
	message_export_format: 'clipboard',
	show_settings_button_in_slack: true,
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

		// Save settings to WXT storage and capture analytics event
		set: async ({ value, changes }) => {
			for (const change of changes) {
				const changePath = change.path[0];
				const changeValue = value[changePath as keyof Settings];
				trackEvent({
					eventName: 'setting_updated',
					eventProperties: {
						setting: changePath,
						value: changeValue,
					},
					userProperties: { [`setting_${changePath}`]: changeValue },
				});
			}
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
export type FeatureUsageCounts = {
	[K in keyof Omit<Settings, 'show_settings_button_in_slack' | 'remove_all_embed_links' | 'embed_link_filters'>]: number;
} & {
	remove_embeds: number
};

const defaultFeatureUsageCounts: FeatureUsageCounts = {
	open_slack_links_in_browser: 0,
	auto_confirm_embed_removal: 0,
	message_export_format: 0,
	remove_embeds: 0,
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

import { observable, syncState, when } from '@legendapp/state';
import { synced } from '@legendapp/state/sync';

import { ph } from '@/utils/analytics';

export type MessageExportFormat = 'clipboard' | 'markdown_file' | 'disabled';

/** Settings stored in Chrome storage */
interface Settings {
	remove_all_embed_links: boolean
	open_slack_links_in_browser: boolean
	auto_confirm_embed_removal: boolean
	show_settings_button_in_slack: boolean
	embed_link_filters: string[]
	message_export_format: MessageExportFormat
}

export const defaultSettings = {
	remove_all_embed_links: false,
	open_slack_links_in_browser: true,
	auto_confirm_embed_removal: true,
	show_settings_button_in_slack: true,
	embed_link_filters: [],
	message_export_format: 'clipboard',
} as const satisfies Settings;

export const defaultSettingsProperties = Object.fromEntries(
	Object.entries(defaultSettings).map(([key, value]) => [`setting_${key}`, value]),
) as Record<`setting_${keyof Settings}`, Settings[keyof Settings]>;

export const defaultSettingsPropertiesWithTheme = {
	...defaultSettingsProperties,
	setting_theme: 'dark' as 'dark' | 'light',
};

const STORAGE_KEY = 'local:settings' as const;

export const settings$ = observable<Settings>(
	synced({
		initial: defaultSettings,

		// Get settings from WXT storage
		get: async () => {
			const value = await storage.getItem(STORAGE_KEY);
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
				ph.capture('setting_updated', {
					setting: changePath,
					value: changeValue,
					$set: { [`setting_${changePath}`]: changeValue },
				});
			}
			await storage.setItem(STORAGE_KEY, JSON.stringify(value));
		},

		// Subscribe to changes from other tabs using WXT storage.watch
		// refresh() re-runs get() to fetch latest
		subscribe: ({ refresh }) => {
			return storage.watch<string>(STORAGE_KEY, () => refresh());
		},
	}),
);

export const loadSettings = async () => {
	settings$.get();
	const status$ = syncState(settings$);
	await when(status$.isLoaded);
};

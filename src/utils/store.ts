import { observable } from '@legendapp/state';
import { synced } from '@legendapp/state/sync';

/** Settings stored in Chrome storage */
interface Settings {
	removeAllEmbedLinks: boolean
	openSlackLinksInBrowser: boolean
	autoConfirmEmbedRemoval: boolean
	showSettingsButtonInSlack: boolean
	embedLinkFilters: string[]
}

const defaultSettings: Settings = {
	removeAllEmbedLinks: false,
	openSlackLinksInBrowser: false,
	autoConfirmEmbedRemoval: true,
	showSettingsButtonInSlack: true,
	embedLinkFilters: [],
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
					return JSON.parse(value as string) as Settings;
				} catch {
					return defaultSettings;
				}
			}
			return defaultSettings;
		},

		// Save settings to WXT storage
		set: async ({ value }) => {
			await storage.setItem(STORAGE_KEY, JSON.stringify(value));
		},

		// Subscribe to changes from other tabs using WXT storage.watch
		// refresh() re-runs get() to fetch latest
		subscribe: ({ refresh }) => {
			return storage.watch<string>(STORAGE_KEY, () => refresh());
		},
	}),
);

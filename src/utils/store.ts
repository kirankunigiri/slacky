import { observable } from '@legendapp/state';
import { syncObservable } from '@legendapp/state/sync';

import { ObservablePersistWXTStorage } from './storage-plugin';

/** Settings stored in Chrome sync storage */
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
export const settings$ = observable<Settings>(defaultSettings);

/** Persist the settings observable to WXT chrome sync storage */
syncObservable(settings$, {
	persist: {
		name: 'settings',
		plugin: new ObservablePersistWXTStorage(),
	},
});

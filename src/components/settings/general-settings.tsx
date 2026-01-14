import { useValue } from '@legendapp/state/react';
import { Checkbox } from '@mantine/core';

import { settings$ } from '@/utils/store';

export function SettingOpenSlackLinksInBrowser() {
	const openSlackLinksInBrowser = useValue(settings$.open_slack_links_in_browser);

	return (
		<Checkbox
			label="Open Slack links in browser"
			id="openSlackLinksInBrowser"
			data-qa="setting-open-slack-links-in-browser"
			checked={openSlackLinksInBrowser}
			onChange={e => settings$.open_slack_links_in_browser.set(e.target.checked)}
		/>
	);
}

export function SettingAutoConfirmEmbedRemoval() {
	const autoConfirmEmbedRemoval = useValue(settings$.auto_confirm_embed_removal);

	return (
		<Checkbox
			label="Auto-confirm embed removal"
			id="autoConfirmEmbedRemoval"
			data-qa="setting-auto-confirm-embed-removal"
			checked={autoConfirmEmbedRemoval}
			onChange={e => settings$.auto_confirm_embed_removal.set(e.target.checked)}
		/>
	);
}

export function SettingShowSettingsButtonInSlack() {
	const showSettingsButtonInSlack = useValue(settings$.show_settings_button_in_slack);

	return (
		<Checkbox
			label="Show settings button in Slack"
			id="showSettingsButtonInSlack"
			data-qa="setting-show-settings-button"
			checked={showSettingsButtonInSlack}
			onChange={e => settings$.show_settings_button_in_slack.set(e.target.checked)}
		/>
	);
}

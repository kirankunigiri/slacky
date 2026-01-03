import { Memo } from '@legendapp/state/react';
import { Checkbox } from '@mantine/core';

import { settings$ } from '@/utils/store';

export function SettingOpenSlackLinksInBrowser() {
	return (
		<Memo>
			{() => (
				<Checkbox
					label="Open Slack links in browser"
					id="openSlackLinksInBrowser"
					checked={settings$.open_slack_links_in_browser.get()}
					onChange={e => settings$.open_slack_links_in_browser.set(e.target.checked)}
				/>
			)}
		</Memo>
	);
}

export function SettingAutoConfirmEmbedRemoval() {
	return (
		<Memo>
			{() => (
				<Checkbox
					label="Auto-confirm embed removal"
					id="autoConfirmEmbedRemoval"
					checked={settings$.auto_confirm_embed_removal.get()}
					onChange={e => settings$.auto_confirm_embed_removal.set(e.target.checked)}
				/>
			)}
		</Memo>
	);
}

export function SettingShowSettingsButtonInSlack() {
	return (
		<Memo>
			{() => (
				<Checkbox
					label="Show settings button in Slack"
					id="showSettingsButtonInSlack"
					checked={settings$.show_settings_button_in_slack.get()}
					onChange={e => settings$.show_settings_button_in_slack.set(e.target.checked)}
				/>
			)}
		</Memo>
	);
}

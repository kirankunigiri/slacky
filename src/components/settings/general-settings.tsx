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
					checked={settings$.openSlackLinksInBrowser.get()}
					onChange={e => settings$.openSlackLinksInBrowser.set(e.target.checked)}
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
					checked={settings$.autoConfirmEmbedRemoval.get()}
					onChange={e => settings$.autoConfirmEmbedRemoval.set(e.target.checked)}
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
					checked={settings$.showSettingsButtonInSlack.get()}
					onChange={e => settings$.showSettingsButtonInSlack.set(e.target.checked)}
				/>
			)}
		</Memo>
	);
}

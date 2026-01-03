import { Button, Divider, Space, Text } from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import ReactDOM from 'react-dom/client';

import Credits from '@/components/credits';
import Header from '@/components/header';
import RemoveEmbedSettings from '@/components/settings/embed-setting';
import MessageExportSettings from '@/components/settings/export-settings';
import { SettingAutoConfirmEmbedRemoval, SettingOpenSlackLinksInBrowser, SettingShowSettingsButtonInSlack } from '@/components/settings/general-settings';
import { BaseApp } from '@/pages/base-app';

function TutorialPageContent() {
	return (
		<div className="flex max-w-[700px] flex-col px-8 py-4">
			<div>
				<Header isTutorialPage />
				<Text size="sm" color="dimmed">Slacky is a browser extension that improves your Slack experience in the browser. This tutorial will walk you through the features and how to use them.</Text>
				<Space h="md" />
			</div>

			{/* Remove Embed Links */}
			<Section>
				<Text size="lg" fw="bold">Remove Embed Links</Text>
				<Text size="sm" color="dimmed">When you include a link in a Slack message, Slack creates an embed/attachment for the message by default. This setting automatically removes these embeds. You can choose to remove all embeds, or only embeds from the domain filters you add.</Text>
				<Space h="md" />
				<div className="max-w-[400px]">
					<RemoveEmbedSettings />
				</div>
			</Section>

			{/* Auto-confirm embed removal */}
			<Section>
				<Text size="lg" fw="bold">Auto-confirm embed removal</Text>
				<Text size="sm" color="dimmed">If you don&apos;t have &quot;remove embed links&quot; enabled, you can still remove embeds manually, but Slack always shows a confirmation dialog. This setting automatically confirms the dialog for you.</Text>
				<Space h="md" />
				<SettingAutoConfirmEmbedRemoval />
			</Section>

			{/* Open Slack links in browser */}
			<Section>
				<Text size="lg" fw="bold">Open Slack links in browser</Text>
				<Text size="sm" color="dimmed">When opening a Slack link in the browser, Slack always asks to open the Slack app. This setting automatically opens the link in the web version instead.</Text>
				<Space h="md" />
				<SettingOpenSlackLinksInBrowser />
			</Section>

			{/* Show settings button in Slack */}
			<Section>
				<Text size="lg" fw="bold">Show settings button in Slack</Text>
				<Text size="sm" color="dimmed">The Slacky settings button will appear in the top right corner of the Slack web app. Clicking it will open the settings.</Text>
				<Space h="md" />
				<SettingShowSettingsButtonInSlack />
			</Section>

			{/* Message Export */}
			<Section>
				<Text size="lg" fw="bold">Message Export</Text>
				<Text size="sm" color="dimmed">A copy button will appear in the top right corner of any Slack channel or thread. Clicking it will copy all messages to the clipboard as markdown, or download as a markdown file.</Text>
				<Space h="md" />
				<div className="flex max-w-[200px] flex-col gap-1.5">
					<Text size="sm" c="dimmed" fw="bold">Export Format</Text>
					<MessageExportSettings />
				</div>
			</Section>

			{/* Contributing & Feature Requests */}
			<Section>
				<Text size="lg" fw="bold">Contributing & Feature Requests</Text>
				<Text size="sm" color="dimmed">You can request new features by opening an issue or directly contribute to the project on GitHub.</Text>
				<Space h="sm" />
				<div className="flex w-full items-baseline justify-between gap-3">
					<Button
						leftSection={<IconBrandGithub />}
						component="a"
						href="https://github.com/kirankunigiri/slacky"
						target="_blank"
						rel="noreferrer"
					>GitHub
					</Button>
					<Credits />
				</div>
			</Section>

		</div>
	);
}
const TutorialPage = withSettingsLoaded(TutorialPageContent);

ReactDOM.createRoot(document.getElementById('root')!).render(
	<BaseApp>
		<TutorialPage />
	</BaseApp>,
);

function Section({ children }: { children: React.ReactNode }) {
	return (
		<div>
			<Divider variant="dashed" />
			<Space h="3xl" />
			{children}
			<Space h="3xl" />
		</div>
	);
}

import 'photoswipe/dist/photoswipe.css';

import { useValue } from '@legendapp/state/react';
import { Badge, Button, Divider, Space, Text } from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import ReactDOM from 'react-dom/client';
import { Gallery, Item } from 'react-photoswipe-gallery';
import { twMerge } from 'tailwind-merge';

import Credits from '@/components/credits';
import Header from '@/components/header';
import RemoveEmbedSettings from '@/components/settings/embed-setting';
import MessageExportSettings from '@/components/settings/export-settings';
import { SettingAutoConfirmEmbedRemoval, SettingOpenSlackLinksInBrowser, SettingShowSettingsButtonInSlack } from '@/components/settings/general-settings';
import { ExportMessageSettingsTest } from '@/components/temp';
import { BaseApp } from '@/pages/base-app';
import { trackEvent } from '@/utils/analytics';
import { FeatureUsageCounts, featureUsageCounts$ } from '@/utils/store';
import { withStorageLoaded } from '@/utils/utils';

function TutorialPageContent() {
	return (
		<div className="relative flex max-w-[800px] flex-col">
			<Divider orientation="vertical" className="absolute top-0 bottom-0 left-0 z-10" />
			<Divider orientation="vertical" className="absolute top-0 right-0 bottom-0 z-10" />

			<Section withBorder={false}>
				<Header isTutorialPage />
				<Text size="sm" c="dimmed">Slacky is a browser extension that improves your Slack experience in the browser. This tutorial will walk you through the features and how to use them. You can customize which features are enabled.</Text>
			</Section>

			{/* Remove Embed Links */}
			<Section
				title="Remove Embed Links"
				description="When you include a link in a Slack message, Slack creates an embed/attachment for the message by default. This setting automatically removes these embeds. You can choose to remove all embeds, or only embeds from the domain filters you add."
				settingName="remove_embeds"
			>
				<div className="max-w-[400px]">
					<RemoveEmbedSettings isTutorialPage />
				</div>
				<Space h="md" />
				<div className="flex w-full justify-between gap-4">
					<LightboxImage src="https://i.imgur.com/JNZ6NUV.gif" width={400} height={549} className="" caption="Before" />
					<LightboxImage src="https://i.imgur.com/G4xssdh.gif" width={400} height={549} className="" caption="After" />
				</div>
			</Section>

			{/* Auto-confirm embed removal */}
			<Section
				title="Auto-confirm embed removal"
				description="If you don't have 'remove embed links' enabled, you can still remove embeds manually, but Slack always shows a confirmation dialog. This setting automatically confirms the dialog for you."
				settingName="auto_confirm_embed_removal"
			>
				<SettingAutoConfirmEmbedRemoval />
				<Space h="md" />
				<div className="flex w-full justify-between gap-4">
					<LightboxImage src="https://i.imgur.com/kG2c5WO.gif" width={400} height={549} className="" caption="Before" />
					<LightboxImage src="https://i.imgur.com/06JOUwj.gif" width={400} height={549} className="" caption="After" />
				</div>
			</Section>

			{/* Open Slack links in browser */}
			<Section
				title="Open Slack links in browser"
				description="When opening a Slack link in the browser, Slack always asks to open the desktop app. This setting automatically opens the web version instead."
				settingName="open_slack_links_in_browser"
			>
				<SettingOpenSlackLinksInBrowser />
				<Space h="md" />
				<LightboxImage src="https://i.imgur.com/Q5OIUgs.png" width={984} height={1026} className="max-h-[350px]" />
			</Section>

			{/* Message Export */}
			<Section
				title="Message Export"
				description="A copy button will appear in the top right corner of any Slack channel or thread. Clicking it will copy all messages to the clipboard or download a markdown file."
				settingName="message_export_format"
			>
				<div className="flex max-w-[200px] flex-col gap-1.5">
					<Text size="sm" c="dimmed" fw="bold">Export Format</Text>
					<MessageExportSettings />
				</div>
				<Space h="md" />
				<LightboxImage src="https://i.imgur.com/BuHZCKG.png" width={1450} height={270} />
			</Section>

			{/* Show settings button in Slack */}
			<Section
				title="Show settings button in Slack"
				description="The Slacky settings button will appear in the top right corner of the Slack web app. Clicking it will open the settings."
			>
				<SettingShowSettingsButtonInSlack />
				<Space h="md" />
				<LightboxImage src="https://i.imgur.com/35yKnHM.png" width={863} height={304} className="max-h-[150px]" />
			</Section>

			{/* Contributing & Feature Requests */}
			<Section
				title="Contributing & Feature Requests"
				description="You can request new features by opening an issue or directly contribute to the project on GitHub."
			>
				<div className="flex w-full items-baseline justify-between gap-3">
					<Button
						leftSection={<IconBrandGithub />}
						component="a"
						href="https://github.com/kirankunigiri/slacky/issues/new"
						target="_blank"
						rel="noreferrer"
						onClick={() => trackEvent({ eventName: 'link_clicked', eventProperties: { type: 'new_github_issue' } })}
					>GitHub
					</Button>
					<Credits />
				</div>
			</Section>

		</div>
	);
}
const TutorialPage = withStorageLoaded(TutorialPageContent);

ReactDOM.createRoot(document.getElementById('root')!).render(
	<BaseApp>
		<TutorialPage />
	</BaseApp>,
);

function Section({ withBorder = true, title, description, children, settingName }: { withBorder?: boolean, title?: string, description?: string, children: React.ReactNode, settingName?: keyof FeatureUsageCounts }) {
	const featureUsageCounts = useValue(featureUsageCounts$);
	const usageCount = settingName ? featureUsageCounts[settingName] : undefined;

	return (
		<div className="bg-black/1! dark:bg-white/5!" data-qa={settingName ? `section-${settingName}` : undefined}>
			{withBorder && <Divider variant="solid" />}
			<Space h="3xl" />
			<div className="px-12">
				<div className="mb-1! flex items-center gap-4">
					{title && <Text size="lg" fw="bold">{title}</Text>}
					{usageCount !== undefined && usageCount > 0 && (
						<Badge
							variant="dot"
							color="blue"
							data-qa={`usage-badge-${settingName}`}
						>Used {usageCount} {usageCount === 1 ? 'time' : 'times'}
						</Badge>
					)}
				</div>
				{description && <Text size="sm" c="dimmed">{description}</Text>}
				{(title || description) && <Space h="md" />}
				{children}
			</div>
			<Space h="3xl" />
		</div>
	);
}

function LightboxImage({ src, width, height, className, caption }: { src: string, width: number, height: number, className?: string, caption?: string }) {
	return (
		<Gallery options={{
			imageClickAction: 'close',
			tapAction: 'close',
			showHideAnimationType: 'zoom',
			hideAnimationDuration: 200,
			showAnimationDuration: 200,
		}}
		>
			<Item
				original={src}
				thumbnail={src}
				width={width}
				height={height}
				cropped
			>
				{({ ref, open }) => (
					<div className="inline-block">
						<img ref={ref} onClick={open} src={src} className={twMerge('cursor-zoom-in rounded-md border-2 border-black/30 dark:border-white/20', className)} />
						{caption && (
							<p className="mt-1.5 text-center text-sm text-gray-500 dark:text-gray-400">
								{caption}
							</p>
						)}
					</div>
				)}
			</Item>
		</Gallery>
	);
}

import { Badge, Divider, ScrollArea, Space } from '@mantine/core';
import ReactDOM from 'react-dom/client';

import Credits from '@/components/credits';
import Header from '@/components/header';
import RemoveEmbedSettings from '@/components/settings/embed-setting';
import MessageExportSettings from '@/components/settings/export-settings';
import { SettingAutoConfirmEmbedRemoval, SettingOpenSlackLinksInBrowser, SettingShowSettingsButtonInSlack } from '@/components/settings/general-settings';
import { BaseApp } from '@/pages/base-app';
import { trackEvent } from '@/utils/analytics';
import { withStorageLoaded } from '@/utils/utils';
import { browser } from '#imports';

export function SettingsPageImpl() {
	const isPopup = window.location.pathname.endsWith('popup.html');
	if (isPopup) {
		return (
			<div className="h-[500px]! max-h-[500px]! w-[340px]! min-w-[340px]! overflow-hidden">
				<SettingsPageContent />
			</div>
		);
	}

	const isSettings = window.location.pathname.endsWith('settings.html');
	if (isSettings) {
		return (
			<div className="h-[500px]! max-h-[500px]! w-[420px]! min-w-[420px]! overflow-hidden">
				<SettingsPageContent />
			</div>
		);
	}

	return (
		<SettingsPageContent />
	);
}
const SettingsPage = withStorageLoaded(SettingsPageImpl);

ReactDOM.createRoot(document.getElementById('root')!).render(
	<BaseApp>
		<SettingsPage />
	</BaseApp>,
);

function SettingsPageContent() {
	return (
		<div className="flex h-full flex-col">
			<Header />
			<Divider className="mx-5" variant="dashed" />

			<div className="relative min-h-0 flex-1">
				<ScrollArea
					scrollbarSize={6}
					offsetScrollbars
					classNames={{
						viewport: 'scroll-shadow',
					}}
					className="mr-0.5 h-full"
				>
					<div className="px-5">
						{/* Remove Embed Links */}
						<Space h="sm" />
						<EmbedLinkSettings />

						<Space h="md" />
						<Divider className="px-5" variant="dashed" />

						{/* General Settings */}
						<Space h="sm" />
						<GeneralSettings />

						<p className="text-base font-medium">Message Export Format</p>
						<Space h="xs" />
						<MessageExportSettings />
						<Space h="xs" />
					</div>
				</ScrollArea>
			</div>

			{/* Footer */}
			<Divider className="mx-5" variant="dashed" />
			<div className="flex justify-around px-5 py-3 text-sm">

				{/* View tutorial button */}
				<Badge
					className="cursor-pointer!"
					component="a"
					href={browser.runtime.getURL('/tutorial.html')}
					target="_blank"
					rel="noreferrer"
					variant="dot"
					color="blue"
					onClick={() => trackEvent({ eventName: 'link_clicked', eventProperties: { type: 'tutorial' } })}
				>
					View tutorial
				</Badge>
				<div className="flex-1"></div>

				<Credits />
			</div>
		</div>
	);
}

function EmbedLinkSettings() {
	return (
		<div className="flex flex-col gap-1">
			<p className="text-base font-medium">Remove Embed Links</p>
			<p className="text-xs opacity-60">Remove all embed links or only remove embeds from a specific domain with filters.</p>
			<Space h="xs" />
			<div>
				<RemoveEmbedSettings />
			</div>
		</div>
	);
}

function GeneralSettings() {
	return (
		<div className="flex flex-col gap-1">
			<p className="text-base font-medium">General</p>
			<div className="h-1"></div>
			<div className="flex items-center space-x-2">
				<div className="flex flex-col gap-3">
					<SettingOpenSlackLinksInBrowser />
					<SettingAutoConfirmEmbedRemoval />
					<SettingShowSettingsButtonInSlack />
					<Space h="xs" />
				</div>
			</div>
		</div>
	);
}

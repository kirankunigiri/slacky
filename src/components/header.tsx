import { ActionIcon, Badge, Text, Tooltip, useMantineColorScheme } from '@mantine/core';
import { modals } from '@mantine/modals';
import { clsx } from 'clsx';
import { Moon, RotateCw, Sun } from 'lucide-react';

import { AnimatedLogo } from '@/components/animated-logo';
import { trackEvent } from '@/utils/analytics';
import { defaultSettingsProperties } from '@/utils/store';
import { browser } from '#imports';

function Header({
	isTutorialPage = false,
}: {
	isTutorialPage?: boolean
}) {
	const { toggleColorScheme, colorScheme } = useMantineColorScheme();

	return (
		<div className={clsx(
			'flex items-center gap-1 pb-3',
			!isTutorialPage && 'px-5 pt-3',
		)}
		>
			<AnimatedLogo />
			<p className="text-xl font-bold">Slacky {isTutorialPage ? ' - Tutorial' : ''}</p>

			{/* In dev mode, this hotlink opens the settings in a new tab */}
			{import.meta.env.MODE === 'development' && !isTutorialPage && (
				<Badge
					href={browser.runtime.getURL('/options.html')}
					target="_blank"
					rel="noreferrer"
					component="a"
					className="ml-2 cursor-pointer!"
					variant="outline"
				>
					dev
				</Badge>
			)}

			{/* Theme + Reset settings */}
			<div className="ml-auto" />
			<div className="flex gap-1">
				{/* Toggle theme */}
				<Tooltip label="Toggle theme">
					<ActionIcon
						variant="light"
						onClick={() => {
							toggleColorScheme();
							const newColorScheme = colorScheme === 'dark' ? 'light' : 'dark';
							trackEvent({
								eventName: 'setting_updated',
								eventProperties: {
									setting: 'theme',
									value: newColorScheme,
								},
								userProperties: { setting_theme: newColorScheme },
							});
						}}
					>
						{colorScheme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
					</ActionIcon>
				</Tooltip>

				{/* Reset settings to default - clears localstorage */}
				<Tooltip label="Reset to default settings">
					<ActionIcon
						color="red"
						className="w-full"
						variant="light"
						onClick={openConfirmResetSettingsModal}
					><RotateCw className="size-3.5" />
					</ActionIcon>
				</Tooltip>
			</div>
		</div>
	);
}

const openConfirmResetSettingsModal = () => modals.openConfirmModal({
	centered: true,
	title: 'Reset to default settings',
	children: (
		<Text size="sm">
			Are you sure you want to clear all settings and reset to the defaults? This action cannot be undone.
		</Text>
	),
	confirmProps: {
		leftSection: <RotateCw className="size-3.5" />,
		color: 'red',
		size: 'xs',
		variant: 'filled',
	},
	cancelProps: {
		size: 'xs',
		variant: 'subtle',
	},
	labels: { confirm: 'Reset', cancel: 'Cancel' },
	onConfirm: () => {
		browser.storage.local.clear();
		trackEvent({
			eventName: 'settings_reset',
			userProperties: defaultSettingsProperties,
		});
	},
});

export default Header;

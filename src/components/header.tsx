import { ActionIcon, Badge, Tooltip, useMantineColorScheme } from '@mantine/core';
import { clsx } from 'clsx';
import { Moon, RotateCw, Sun } from 'lucide-react';

import { AnimatedLogo } from '@/components/animated-logo';

function Header({
	isTutorialPage = false,
}: {
	isTutorialPage?: boolean
}) {
	const { toggleColorScheme, colorScheme } = useMantineColorScheme();

	return (
		<div className={clsx(
			'flex items-center gap-1 pt-3 pb-3',
			!isTutorialPage && 'px-5',
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

			{/* Devtools */}
			<div className="ml-auto" />
			<div className="flex gap-1">
				{/* Toggle theme */}
				<Tooltip label="Toggle theme">
					<ActionIcon variant="light" onClick={toggleColorScheme}>
						{colorScheme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
					</ActionIcon>
				</Tooltip>

				{/* Clear storage */}
				<Tooltip label="Clear storage">
					<ActionIcon
						color="red"
						className="w-full"
						variant="light"
						onClick={() => {
							browser.storage.local.clear();
						}}
					><RotateCw className="size-3.5" />
					</ActionIcon>
				</Tooltip>
			</div>
		</div>
	);
}

export default Header;

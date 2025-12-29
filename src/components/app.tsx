import { syncState } from '@legendapp/state';
import { Memo, useValue } from '@legendapp/state/react';
import { ActionIcon, Badge, Button, Checkbox, Divider, ScrollArea, Space, TextInput, Tooltip, useMantineColorScheme } from '@mantine/core';
import { Moon, PlusIcon, RotateCw, Sun, TrashIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';

import { AnimatedLogo } from '@/components/animated-logo';
import { settings$ } from '@/utils/store';

function App() {
	// Hide app until settings are loaded to prevent flicker/jank with default values being used first
	const state$ = syncState(settings$);
	const isLoaded = useValue(state$.isLoaded);
	if (!isLoaded) {
		settings$.get();
		return null;
	}

	const isPopup = window.location.pathname.endsWith('popup.html');
	if (isPopup) {
		return (
			<div className="h-[500px] max-h-[500px] overflow-hidden">
				<AppContent />
			</div>
		);
	}

	return <AppContent />;
}

function AppContent() {
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

						{/* Other Settings */}
						<Space h="sm" />
						<OtherSettings />
					</div>
				</ScrollArea>
			</div>

			{/* Footer */}
			{/* <Space h="md" /> */}
			<Divider className="mx-5" variant="dashed" />
			<div className="flex justify-around px-5 py-3 text-sm">
				<Badge variant="dot" color="blue">View tutorial</Badge>
				<div className="flex-1"></div>
				<a
					href="https://github.com/kirankunigiri"
					target="_blank"
					rel="noreferrer"
					className="group"
				>
					<p className="relative inline-block flex-1 cursor-pointer text-right opacity-60
							after:absolute after:bottom-0 after:left-0 after:block after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-gray-300 after:transition-transform after:duration-200 after:content-[''] group-hover:after:scale-x-100 dark:after:bg-gray-600"
					>
						v1.0 by Kiran Kunigiri
					</p>
				</a>
			</div>
		</div>
	);
}

let filterIdCounter = 0;
const MAX_DOMAIN_FILTERS = 30;

function EmbedLinkSettings() {
	const removeAllEmbedLinks = useValue(settings$.removeAllEmbedLinks);
	const embedLinkFilters = useValue(settings$.embedLinkFilters);

	// Track stable IDs for each filter (needed for proper exit animations)
	const filterIdsRef = useRef<number[]>([]);
	while (filterIdsRef.current.length < embedLinkFilters.length) {
		filterIdsRef.current.push(filterIdCounter++);
	}

	const canAddFilter = embedLinkFilters.length < MAX_DOMAIN_FILTERS;

	const addFilter = () => {
		if (!canAddFilter) return;
		settings$.removeAllEmbedLinks.set(false);
		const hasEmpty = settings$.embedLinkFilters.get().some(f => f === '');
		if (hasEmpty) {
			return;
		}
		const newFilters = [...settings$.embedLinkFilters.get(), ''];
		settings$.embedLinkFilters.set(newFilters);
	};

	const removeFilter = (index: number) => {
		filterIdsRef.current.splice(index, 1);
		const newFilters = settings$.embedLinkFilters.get().filter((_, i) => i !== index);
		settings$.embedLinkFilters.set(newFilters);
	};

	const updateFilter = (index: number, value: string) => {
		const newFilters = [...settings$.embedLinkFilters.get()];
		newFilters[index] = value;
		settings$.embedLinkFilters.set(newFilters);
	};

	return (
		<div className="flex flex-col gap-1">
			<p className="text-base font-medium">Remove Embed Links</p>
			<p className="text-xs opacity-60">Remove all embed links or only remove embeds from a specific domain with filters.</p>
			<Space h="xs" />

			{/* Remove All */}
			<div className="flex justify-between">
				<Checkbox
					label="Remove all embeds"
					id="removeAllEmbedLinks"
					checked={removeAllEmbedLinks}
					onChange={e => settings$.removeAllEmbedLinks.set(e.target.checked)}
				/>
				<Tooltip label={!canAddFilter ? `You cannot add more than ${MAX_DOMAIN_FILTERS} domain filters` : 'Only embed links from these domains will be automatically removed.'}>
					<Button
						variant="light"
						size="compact-xs"
						onClick={addFilter}
						disabled={!canAddFilter || embedLinkFilters.some(f => f === '')}
					>
						<div className="flex items-center gap-1">
							<PlusIcon size={16} />
							Domain Filter
						</div>
					</Button>
				</Tooltip>
			</div>

			{/* Domain Filter Section - Hidden when auto-remove is enabled */}
			<AnimatePresence initial={false}>
				{!removeAllEmbedLinks && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						className="overflow-hidden"
					>
						{/* Domain Filter List v2 */}
						<Space h={7} />
						<div className="flex flex-col">
							<AnimatePresence initial={false}>
								{embedLinkFilters.map((filter, index) => (
									<motion.div
										key={filterIdsRef.current[index]}
										initial={{ opacity: 0, x: -36, height: 0 }}
										animate={{ opacity: 1, x: 0, height: 'auto' }}
										exit={{ opacity: 0, x: 16, height: 0 }}
										transition={{ duration: 0.15, ease: 'easeOut' }}
										className="group flex items-center overflow-hidden border border-t-0 border-black/10 bg-black/3 first:rounded-t-lg first:border-t last:rounded-b-lg hover:bg-black/8 dark:border-white/10 dark:bg-white/5 hover:dark:bg-white/8"
									>
										<TextInput
											variant="unstyled"
											value={filter}
											onChange={e => updateFilter(index, e.target.value)}
											placeholder="Domain (ex: github.com)"
											className="w-full px-3"
										/>
										<ActionIcon
											className="mr-2 p-2 opacity-0 transition-opacity group-hover:opacity-100"
											onClick={() => removeFilter(index)}
											color="red"
											size="sm"
											aria-label="Settings"
											variant="subtle"
										>
											<TrashIcon className="size-3" />
										</ActionIcon>
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

function OtherSettings() {
	return (
		<div className="flex flex-col gap-1">
			<p className="text-base font-medium">Advanced</p>
			<div className="h-1"></div>
			<div className="flex items-center space-x-2">
				<div className="flex flex-col gap-3">
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
					<Memo>
						{() => (
							<Checkbox
								label="Show settings button in Slack"
								id="terms"
								checked={settings$.showSettingsButtonInSlack.get()}
								onChange={e => settings$.showSettingsButtonInSlack.set(e.target.checked)}
							/>
						)}
					</Memo>
					<Space h="xs" />
				</div>
			</div>
		</div>
	);
}

function Header() {
	const { toggleColorScheme, colorScheme } = useMantineColorScheme();

	return (
		<div className="flex items-center gap-1 px-5 pt-3 pb-3">
			<AnimatedLogo />
			<p className="text-xl font-bold">Slacky</p>
			<a
				className="ml-2"
				href={`chrome-extension://${browser.runtime.id}/options.html`}
				target="_blank"
				rel="noreferrer"
			>
				<Badge variant="outline">dev</Badge>
				{/* {import.meta.env.MODE === 'development' && (
					<Badge variant="outline">dev</Badge>
				)} */}
			</a>

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

export default App;

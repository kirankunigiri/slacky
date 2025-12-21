import { useValue } from '@legendapp/state/react';
import { ActionIcon, Badge, Button, Checkbox, Divider, Space, TextInput, Tooltip, useMantineColorScheme } from '@mantine/core';
import { Moon, PlusIcon, RotateCw, Sun, TrashIcon } from 'lucide-react';

import { AnimatedLogo } from '@/components/animated-logo';
import { settings$ } from '@/utils/store';

function App() {
	const removeAllEmbedLinks = useValue(settings$.removeAllEmbedLinks);
	const openSlackLinksInBrowser = useValue(settings$.openSlackLinksInBrowser);
	const autoConfirmEmbedRemoval = useValue(settings$.autoConfirmEmbedRemoval);
	const showSettingsButtonInSlack = useValue(settings$.showSettingsButtonInSlack);
	const embedLinkFilters = useValue(settings$.embedLinkFilters);

	console.log('📊 App render - embedLinkFilters:', embedLinkFilters);

	const addFilter = () => {
		console.log('🔵 addFilter clicked');
		console.log('Current embedLinkFilters:', embedLinkFilters);
		settings$.removeAllEmbedLinks.set(false);
		const hasEmpty = embedLinkFilters.some(f => f === '');
		console.log('Has empty?', hasEmpty);
		if (hasEmpty) {
			console.log('⚠️ Cannot add - empty filter exists');
			return;
		}
		const newFilters = [...embedLinkFilters, ''];
		console.log('Setting new filters:', newFilters);
		settings$.embedLinkFilters.set(newFilters);
		console.log('✅ Filter added');
	};

	const removeFilter = (index: number) => {
		console.log('🔴 removeFilter called for index:', index);
		const newFilters = embedLinkFilters.filter((_, i) => i !== index);
		console.log('New filters after removal:', newFilters);
		settings$.embedLinkFilters.set(newFilters);
	};

	const updateFilter = (index: number, value: string) => {
		console.log('✏️ updateFilter called for index:', index, 'value:', value);
		const newFilters = [...embedLinkFilters];
		newFilters[index] = value;
		console.log('New filters after update:', newFilters);
		settings$.embedLinkFilters.set(newFilters);
	};

	return (
		<>
			<div className="p-4 flex flex-col gap-2">
				<Header />

				{/* Remove Embed Links */}
				<Divider className="mt-1 mb-2" variant="dashed" />
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
						<Tooltip label="Only embed links from these domains will be automatically removed.">
							<Button
								variant="light"
								size="compact-xs"
								onClick={addFilter}
								disabled={embedLinkFilters.some(f => f === '')}
							>
								<div className="flex gap-1 items-center">
									<PlusIcon size={16} />
									Domain Filter
								</div>
							</Button>
						</Tooltip>
					</div>
					<div className="h-1"></div>

					{/* Domain Filter Section - Hidden when auto-remove is enabled */}
					<div className={`overflow-hidden transition-all duration-300 ${removeAllEmbedLinks ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
						{/* Domain Filter List v2 */}
						<div className="flex flex-col">
							{embedLinkFilters.map((filter, index) => (
								<div
									key={index}
									className="flex items-center border border-white/10 border-t-0 first:border-t overflow-hidden group dark:bg-input/5 hover:dark:bg-input/10 transition-all duration-300 animate-in slide-in-from-left-4 fade-in first:rounded-t-lg last:rounded-b-lg"
								>
									<TextInput
										variant="unstyled"
										value={filter}
										onChange={e => updateFilter(index, e.target.value)}
										placeholder="Domain (ex: github.com)"
										className="px-3 w-full"
									/>
									<ActionIcon
										className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 p-2"
										onClick={() => removeFilter(index)}
										color="red"
										size="sm"
										aria-label="Settings"
										variant="subtle"
									>
										<TrashIcon className="size-3" />
									</ActionIcon>
								</div>
							))}
						</div>
					</div>

				</div>

				<Space h="sm" />
				<Divider className="mt-1 mb-2" variant="dashed" />

				<div className="flex flex-col gap-1">
					<p className="text-base font-medium">Advanced</p>
					<div className="h-1"></div>
					<div className="flex items-center space-x-2">
						<div className="flex flex-col gap-3">
							<Checkbox
								label="Open Slack links in browser"
								id="openSlackLinksInBrowser"
								checked={openSlackLinksInBrowser}
								onChange={e => settings$.openSlackLinksInBrowser.set(e.target.checked)}
							/>
							<Checkbox
								label="Auto-confirm embed removal"
								id="autoConfirmEmbedRemoval"
								checked={autoConfirmEmbedRemoval}
								onChange={e => settings$.autoConfirmEmbedRemoval.set(e.target.checked)}
							/>
							<Checkbox
								label="Show settings button in Slack"
								id="terms"
								checked={showSettingsButtonInSlack}
								onChange={e => settings$.showSettingsButtonInSlack.set(e.target.checked)}
							/>
						</div>
					</div>
				</div>

				{/* Credit Section */}
				<Space h="md" />
				<Divider className="mt-5 mb-1" variant="dashed" />
				<div className="flex justify-around text-sm">
					<Badge variant="dot" color="blue">View tutorial</Badge>
					<div className="flex-1"></div>
					<a
						href="https://github.com/kirankunigiri"
						target="_blank"
						rel="noreferrer"
						className="group"
					>
						<p className="flex-1 text-right opacity-60 inline-block cursor-pointer relative
							after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] after:bg-gray-300 dark:after:bg-gray-600 after:scale-x-0 after:transition-transform after:duration-200 group-hover:after:scale-x-100 after:origin-left"
						>
							v1.0 by Kiran Kunigiri
						</p>
					</a>
				</div>
			</div>

		</>
	);
}

function Header() {
	return (
		<div className="flex items-center gap-1">
			<AnimatedLogo />
			<p className="text-xl font-bold">Slacky</p>
			<a
				className="ml-2"
				href={`chrome-extension://${browser.runtime.id}/devpage.html`}
				target="_blank"
				rel="noreferrer"
			>
				<Badge variant="outline">{import.meta.env.MODE}</Badge>
			</a>

			{/* Devtools */}
			<div className="ml-auto" />
			<div className="flex gap-1">
				<ToggleThemeButton />
				<Tooltip label="Clear storage">
					<ActionIcon
						color="red"
						className="w-full"
						variant="light"
						onClick={() => {
							console.log('Clearing storage');
							browser.storage.sync.clear();
						}}
					><RotateCw className="size-3.5" />
					</ActionIcon>
				</Tooltip>
			</div>
		</div>
	);
}

function ToggleThemeButton() {
	const { toggleColorScheme, colorScheme } = useMantineColorScheme();

	return (
		<Tooltip label="Toggle theme">
			<ActionIcon variant="light" onClick={toggleColorScheme}>
				{colorScheme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
			</ActionIcon>
		</Tooltip>
	);
}

export default App;

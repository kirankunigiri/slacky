import { Memo, useValue } from '@legendapp/state/react';
import { ActionIcon, Badge, Button, Checkbox, Divider, Space, TextInput, Tooltip, useMantineColorScheme } from '@mantine/core';
import { Moon, PlusIcon, RotateCw, Sun, TrashIcon } from 'lucide-react';

import { AnimatedLogo } from '@/components/animated-logo';
import { settings$ } from '@/utils/store';

function App() {
	return (
		<div className="flex flex-col gap-2 p-4">
			<Header />

			{/* Remove Embed Links */}
			<Divider className="mt-1 mb-2" variant="dashed" />
			<EmbedLinkSettings />

			<Space h="sm" />
			<Divider className="mt-1 mb-2" variant="dashed" />

			{/* Other Settings */}
			<OtherSettings />

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

function EmbedLinkSettings() {
	const removeAllEmbedLinks = useValue(settings$.removeAllEmbedLinks);
	const embedLinkFilters = useValue(settings$.embedLinkFilters);

	const addFilter = () => {
		settings$.removeAllEmbedLinks.set(false);
		const hasEmpty = settings$.embedLinkFilters.get().some(f => f === '');
		if (hasEmpty) {
			return;
		}
		const newFilters = [...settings$.embedLinkFilters.get(), ''];
		settings$.embedLinkFilters.set(newFilters);
	};

	const removeFilter = (index: number) => {
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
				<Tooltip label="Only embed links from these domains will be automatically removed.">
					<Button
						variant="light"
						size="compact-xs"
						onClick={addFilter}
						disabled={embedLinkFilters.some(f => f === '')}
					>
						<div className="flex items-center gap-1">
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
							className="group flex animate-in items-center overflow-hidden border border-t-0 border-black/10 bg-black/3 transition-all duration-300 fade-in slide-in-from-left-4 first:rounded-t-lg first:border-t last:rounded-b-lg hover:bg-black/8 dark:border-white/10 dark:bg-white/5 hover:dark:bg-white/8"
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
						</div>
					))}
				</div>
			</div>
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
				</div>
			</div>
		</div>
	);
}

function Header() {
	const { toggleColorScheme, colorScheme } = useMantineColorScheme();

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

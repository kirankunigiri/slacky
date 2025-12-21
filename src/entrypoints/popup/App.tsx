import { useValue } from '@legendapp/state/react';
import { PlusIcon, TrashIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedLogo } from '@/entrypoints/popup/lib/animated-logo';
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
				<div className="flex items-center gap-1">
					{/* Logo */}
					{/* <div className="size-5"> */}
					{/* <a href="https://github.com/kirankunigiri/slacky" target="_blank" rel="noreferrer">
							<img src={icon} className="logo" alt="Slacky logo" />
						</a> */}
					<AnimatedLogo />
					{/* </div> */}
					{/* Title */}
					<p className="text-xl font-bold">Slacky</p>
					<a
						className="ml-2"
						href={`chrome-extension://${browser.runtime.id}/devpage.html`}
						target="_blank"
						rel="noreferrer"
					>
						<Badge variant="outline">{import.meta.env.MODE}</Badge>
					</a>
				</div>

				{/* Remove Embed Links */}
				<div className="flex flex-col gap-1">
					<p className="text-base font-medium">Remove Embed Links</p>
					<div></div>

					{/* Remove All */}
					<div className="flex items-center space-x-2">
						<Switch
							id="auto-remove-all"
							checked={removeAllEmbedLinks}
							onCheckedChange={checked => settings$.removeAllEmbedLinks.set(checked)}
						/>
						<Label htmlFor="auto-remove-all" className="opacity-80 font-light">Remove All Embed Links</Label>
					</div>
					<div className="h-1"></div>

					{/* Domain Filter Section - Hidden when auto-remove is enabled */}
					<div className={`overflow-hidden transition-all duration-300 ${removeAllEmbedLinks ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
						<div className="flex justify-start">
							<Tooltip>
								<TooltipTrigger asChild>
									<div>
										<Button
											size="xs"
											onClick={addFilter}
											disabled={embedLinkFilters.some(f => f === '')}
										>
											<PlusIcon />
											Domain Filter
										</Button>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p>Only embed links from these domains will be automatically removed.</p>
								</TooltipContent>
							</Tooltip>
						</div>
						<div className="h-2"></div>

						{/* Domain Filter List v2 */}
						<div className="flex flex-col">
							{embedLinkFilters.map((filter, index) => (
								<div
									key={index}
									className="flex items-center border border-input border-t-0 first:border-t overflow-hidden group dark:bg-input/30 hover:dark:bg-input/50 transition-all duration-300 animate-in slide-in-from-left-4 fade-in"
								>
									<Input
										value={filter}
										onChange={e => updateFilter(index, e.target.value)}
										placeholder="Domain (ex: github.com)"
										className="rounded-none bg-transparent! border-0 focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none text-sm flex-1 w-full shadow-none"
									/>
									<Button
										variant="destructive"
										size="icon-xs"
										aria-label="Remove"
										className="opacity-0 group-hover:opacity-100 transition-opacity mr-2"
										onClick={() => removeFilter(index)}
									>
										<TrashIcon />
									</Button>
								</div>
							))}
						</div>
					</div>

				</div>

				<Separator className="my-1" />

				<div className="flex flex-col gap-1">
					<p className="text-base font-medium">Advanced</p>
					<div className="h-1"></div>
					<div className="flex items-center space-x-2">
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-2">
								<Checkbox
									id="terms"
									checked={showSettingsButtonInSlack}
									onCheckedChange={checked => settings$.showSettingsButtonInSlack.set(checked)}
								/>
								<Label htmlFor="terms">Show settings button in Slack</Label>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox
									id="openSlackLinksInBrowser"
									checked={openSlackLinksInBrowser}
									onCheckedChange={checked => settings$.openSlackLinksInBrowser.set(checked)}
								/>
								<Label htmlFor="openSlackLinksInBrowser">Open Slack links in browser</Label>
							</div>
							<div className="flex items-center gap-2">
								<Checkbox
									id="autoConfirmEmbedRemoval"
									checked={autoConfirmEmbedRemoval}
									onCheckedChange={checked => settings$.autoConfirmEmbedRemoval.set(checked)}
								/>
								<Label htmlFor="autoConfirmEmbedRemoval">Auto-confirm embed removal</Label>
							</div>

							{/* <Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-green-600 has-[[aria-checked=true]]:bg-green-50 dark:has-[[aria-checked=true]]:border-green-900 dark:has-[[aria-checked=true]]:bg-green-950">
								<Checkbox
									id="toggle-2"
									defaultChecked
									className="data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:text-white dark:data-[state=checked]:border-green-700 dark:data-[state=checked]:bg-green-700"
								/>
								<div className="grid gap-1.5 font-normal">
									<p className="text-sm leading-none font-medium">
										Open Slack links in browser
									</p>
									<p className="text-muted-foreground text-sm">
										Avoid opening links in the desktop app.
									</p>
								</div>
							</Label> */}
						</div>
					</div>
				</div>

				{/* Credit Section */}
				<Separator className="mt-3 mb-1" />
				<div className="flex justify-around opacity-60">
					<p className="flex-1">v1.0</p>
					<a href="https://github.com/kirankunigiri" target="_blank" rel="noreferrer"><p className="flex-1 text-right">By Kiran Kunigiri</p></a>
				</div>

				{/* Devtools */}
				<Separator className="my-2" />
				<Button
					className="w-full"
					variant="default"
					size="icon"
					onClick={() => {
						console.log('Clearing storage');
						browser.storage.sync.clear();
					}}
				>Clear Storage
				</Button>

				{/* Testing Section */}
				{/* <AnimatedLogo /> */}

				{/* <Input type="email" placeholder="Email" className="text-sm" /> */}

				{/* <DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon">
							<Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
							<Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
							<span className="sr-only">Toggle theme</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setTheme('light')}>
							Light
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme('dark')}>
							Dark
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme('system')}>
							System
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu> */}
			</div>

		</>
	);
}

export default App;

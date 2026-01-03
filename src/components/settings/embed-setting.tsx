import { useValue } from '@legendapp/state/react';
import { ActionIcon, Button, Checkbox, Space, TextInput, Tooltip } from '@mantine/core';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';

import { settings$ } from '@/utils/store';

let filterIdCounter = 0;
const MAX_DOMAIN_FILTERS = 30;

function RemoveEmbedSettings() {
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
		<>
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
						{embedLinkFilters.length > 0 && <Space h={7} />}
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
		</>
	);
}

export default RemoveEmbedSettings;

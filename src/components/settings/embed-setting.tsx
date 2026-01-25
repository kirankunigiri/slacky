import { useValue } from '@legendapp/state/react';
import { ActionIcon, Button, SegmentedControl, Space, TextInput, Tooltip } from '@mantine/core';
import { IconExclamationCircle } from '@tabler/icons-react';
import clsx from 'clsx';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { type RemoveEmbedLinkMode, settings$ } from '@/utils/store';

let filterIdCounter = 0;
const MAX_DOMAIN_FILTERS = 30;

/** Validates if a string looks like a valid domain (e.g., github.com, api.example.co.uk) */
const isValidDomain = (domain: string): boolean => {
	if (!domain || domain.length === 0) return false;

	// Domain regex: allows letters, numbers, hyphens, and dots
	// Must have at least one dot, segments can't start/end with hyphen
	const domainRegex = /^(?!-)([a-z0-9-]+(?<!-)\.)+[a-z]{2,}$/i;
	return domainRegex.test(domain);
};

function FilterInput({
	filter,
	index,
	filterKey,
	onUpdate,
	onRemove,
	autoFocus,
}: {
	filter: string
	index: number
	filterKey: number
	onUpdate: (index: number, value: string) => void
	onRemove: (index: number) => void
	autoFocus?: boolean
}) {
	const [localValue, setLocalValue] = useState(filter);
	const [hasBlurred, setHasBlurred] = useState(false);
	const isValid = isValidDomain(localValue);
	const showError = hasBlurred && !isValid;

	// Sync local state when external filter changes
	useEffect(() => {
		setLocalValue(filter);
	}, [filter]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setLocalValue(value);
		// Only update store if domain is valid
		if (isValidDomain(value)) {
			onUpdate(index, value);
		}
	};

	return (
		<motion.div
			key={filterKey}
			initial={{ opacity: 0, x: -36, height: 0 }}
			animate={{ opacity: 1, x: 0, height: 'auto' }}
			exit={{ opacity: 0, x: 16, height: 0 }}
			transition={{ duration: 0.15, ease: 'easeOut' }}
			className={clsx(
				'group flex items-center overflow-hidden border border-t-0 first:rounded-t-lg first:border-t last:rounded-b-lg',
				showError
					? 'border-red-400/50 bg-red-500/5 hover:bg-red-500/10 dark:border-red-400/30'
					: 'border-black/10 bg-black/3 hover:bg-black/8 dark:border-white/10 dark:bg-white/5 hover:dark:bg-white/8',
			)}
		>
			<TextInput
				autoFocus={autoFocus}
				variant="unstyled"
				value={localValue}
				onChange={handleChange}
				onBlur={() => setHasBlurred(true)}
				placeholder="Domain (ex: github.com)"
				className="w-full px-3"
				data-qa={`domain-filter-input-${index}`}
			/>
			{showError && (
				<Tooltip label="Invalid domain. Example: github.com" openDelay={0}>
					<IconExclamationCircle className="mr-1 size-5 text-red-400" />
				</Tooltip>
			)}
			<ActionIcon
				className="mr-2 p-2 opacity-0 transition-opacity group-hover:opacity-100"
				onClick={() => onRemove(index)}
				color="red"
				size="sm"
				aria-label="Remove filter"
				variant="subtle"
			>
				<TrashIcon className="size-3" />
			</ActionIcon>
		</motion.div>
	);
}

function RemoveEmbedSettings(
	{ isTutorialPage = false }: { isTutorialPage?: boolean },
) {
	const removeEmbedLinkMode = useValue(settings$.remove_embed_link_mode);
	const embedLinkFilters = useValue(settings$.embed_link_filters);

	// Track stable IDs for each filter (needed for proper exit animations)
	const filterIdsRef = useRef<number[]>([]);
	while (filterIdsRef.current.length < embedLinkFilters.length) {
		filterIdsRef.current.push(filterIdCounter++);
	}

	const canAddFilter = embedLinkFilters.length < MAX_DOMAIN_FILTERS;

	const addFilter = () => {
		if (!canAddFilter) return;
		settings$.remove_embed_link_mode.set('filter');
		const hasEmpty = settings$.embed_link_filters.get().some(f => f === '');
		if (hasEmpty) {
			return;
		}
		const newFilters = [...settings$.embed_link_filters.get(), ''];
		settings$.embed_link_filters.set(newFilters);
	};

	const removeFilter = (index: number) => {
		filterIdsRef.current.splice(index, 1);
		const newFilters = settings$.embed_link_filters.get().filter((_, i) => i !== index);
		settings$.embed_link_filters.set(newFilters);

		// If we deleted the last filter, automatically switch to "remove all" mode
		if (newFilters.length === 0 && removeEmbedLinkMode === 'filter') {
			settings$.remove_embed_link_mode.set('all');
		}
	};

	const updateFilter = (index: number, value: string) => {
		const newFilters = [...settings$.embed_link_filters.get()];
		newFilters[index] = value;
		settings$.embed_link_filters.set(newFilters);
	};

	return (
		<>
			{/* Segmented Control */}
			<div className={clsx(
				'flex items-center',
				isTutorialPage ? 'gap-4' : 'justify-between',
			)}
			>
				<SegmentedControl
					withItemsBorders={false}
					radius="xl"
					value={removeEmbedLinkMode}
					onChange={value => settings$.remove_embed_link_mode.set(value as RemoveEmbedLinkMode)}
					data={[
						{ label: 'Off', value: 'off' },
						{ label: 'Remove all', value: 'all' },
						{ label: 'Remove some', value: 'filter' },
					] satisfies { label: string, value: RemoveEmbedLinkMode }[]}
					data-qa="setting-remove-embeds-control"
				/>
				{removeEmbedLinkMode === 'filter' && (
					<Tooltip label={!canAddFilter ? `You cannot add more than ${MAX_DOMAIN_FILTERS} domain filters` : 'Only embed links from these domains will be automatically removed.'}>
						<Button
							variant="light"
							size="compact-xs"
							onClick={addFilter}
							disabled={!canAddFilter || embedLinkFilters.some(f => f === '')}
							data-qa="add-domain-filter-btn"
						>
							<div className="flex items-center gap-1">
								<PlusIcon size={16} />
								Domain Filter
							</div>
						</Button>
					</Tooltip>
				)}
			</div>

			{/* Domain Filter Section - Hidden when not "filter" */}
			<AnimatePresence initial={false}>
				{removeEmbedLinkMode === 'filter' && (
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
									<FilterInput
										key={filterIdsRef.current[index]}
										filter={filter}
										index={index}
										filterKey={filterIdsRef.current[index]}
										onUpdate={updateFilter}
										onRemove={removeFilter}
										autoFocus={filter === '' && index === embedLinkFilters.length - 1}
									/>
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

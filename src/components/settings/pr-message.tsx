import { useValue } from '@legendapp/state/react';
import { ActionIcon, Button, Checkbox, Modal, Space, TextInput, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconExclamationCircle } from '@tabler/icons-react';
import clsx from 'clsx';
import { InfoIcon, PlusIcon, RotateCcw, TrashIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { DEFAULT_PR_TEMPLATE, settings$ } from '@/utils/store';

let channelIdCounter = 0;
const MAX_CHANNELS = 30;

// Valid variable names that can be used in the template
// Note: 'url' is kept for backward compatibility and maps to 'github_url'
const VALID_PR_VARIABLES = ['url', 'github_url', 'graphite_url', 'title', 'linesAdded', 'linesRemoved', 'repo'];

/** Validates if a string looks like a valid Slack channel URL */
const isValidSlackUrl = (url: string): boolean => {
	if (!url || url.length === 0) return false;
	// Match URLs like: https://app.slack.com/client/T015X7RTX70/C0A7LL1Q5ED
	const slackUrlRegex = /^https:\/\/app\.slack\.com\/client\/[A-Z0-9]+\/[A-Z0-9]+$/;
	return slackUrlRegex.test(url);
};

/** Validates if a string is a non-empty channel name */
const isValidChannelName = (name: string): boolean => {
	// Must be non-empty
	return name !== null && name !== undefined && name.trim().length > 0;
};

/** Validates if a PR message template is valid */
const isValidPRTemplate = (template: string): { valid: boolean, error?: string } => {
	if (!template || template.trim().length === 0) {
		return { valid: false, error: 'Template cannot be empty' };
	}

	// Check for template literal syntax with double curly braces {{variable}}
	const templateVarRegex = /\{\{([^}]+)\}\}/g;
	const matches = [...template.matchAll(templateVarRegex)];

	if (matches.length === 0) {
		return { valid: true }; // Template with no variables is valid
	}

	// Validate each variable
	for (const match of matches) {
		const varName = match[1].trim();

		if (!VALID_PR_VARIABLES.includes(varName)) {
			return { valid: false, error: `Unknown variable: ${varName}. Valid variables are: ${VALID_PR_VARIABLES.join(', ')}` };
		}
	}

	return { valid: true };
};

function PRMessageTemplateEditor() {
	const prMessageTemplate = useValue(settings$.pr_message_template);

	// Template input state
	const [localTemplate, setLocalTemplate] = useState(prMessageTemplate);
	const [templateError, setTemplateError] = useState<string | null>(null);

	// Sync local template when external value changes
	useEffect(() => {
		setLocalTemplate(prMessageTemplate);
	}, [prMessageTemplate]);

	const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setLocalTemplate(value);

		// Validate on change
		const validation = isValidPRTemplate(value);

		if (!validation.valid) {
			setTemplateError(validation.error || 'Invalid template');
		} else {
			setTemplateError(null);
			// Save to store
			settings$.pr_message_template.set(value);
		}
	};

	const handleReset = () => {
		setLocalTemplate(DEFAULT_PR_TEMPLATE);
		setTemplateError(null);
		settings$.pr_message_template.set(DEFAULT_PR_TEMPLATE);
	};

	return (
		<>
			<div className="flex items-center gap-2">
				<label htmlFor="prMessageTemplate" className="text-sm font-medium">
					PR Message Template
				</label>
				<Tooltip
					label={(
						<div className="p-2 text-xs">
							<div className="mb-1 font-semibold">Available variables:</div>
							<ul className="list-inside list-disc space-y-0.5">
								<li><code>{'{{github_url}}'}</code> - The GitHub PR URL</li>
								<li><code>{'{{graphite_url}}'}</code> - The Graphite PR URL</li>
								<li><code>{'{{title}}'}</code> - The PR title</li>
								<li><code>{'{{linesAdded}}'}</code> - Number of lines added</li>
								<li><code>{'{{linesRemoved}}'}</code> - Number of lines removed</li>
								<li><code>{'{{repo}}'}</code> - Repository name (owner/repo)</li>
							</ul>
						</div>
					)}
					multiline
					w={350}
				>
					<InfoIcon className="size-4 cursor-help opacity-50" />
				</Tooltip>
			</div>
			<Space h={4} />
			<div className="flex items-center gap-2">
				<TextInput
					id="prMessageTemplate"
					value={localTemplate}
					onChange={handleTemplateChange}
					error={templateError || undefined}
					data-qa="pr-message-template-input"
					className="flex-1"
				/>
				<Tooltip label="Reset to default template">
					<ActionIcon
						onClick={handleReset}
						variant="default"
						size="md"
						aria-label="Reset to default template"
						data-qa="reset-template-btn"
					>
						<RotateCcw className="size-3" />
					</ActionIcon>
				</Tooltip>
			</div>
			<Space h="md" />
		</>
	);
}

function AddSlackChannelModal({
	opened,
	onClose,
	onSubmit,
}: {
	opened: boolean
	onClose: () => void
	onSubmit: (channel: { url: string, name: string, default: boolean }) => void
}) {
	const [newChannelUrl, setNewChannelUrl] = useState('');
	const [newChannelName, setNewChannelName] = useState('');
	const [newChannelDefault, setNewChannelDefault] = useState(false);
	const [hasBlurredModalUrl, setHasBlurredModalUrl] = useState(false);
	const [hasBlurredModalName, setHasBlurredModalName] = useState(false);

	// Reset form when modal opens
	useEffect(() => {
		if (opened) {
			setNewChannelUrl('');
			setNewChannelName('');
			setNewChannelDefault(false);
			setHasBlurredModalUrl(false);
			setHasBlurredModalName(false);
		}
	}, [opened]);

	const handleSubmit = () => {
		// Validate before submitting
		const isUrlValid = isValidSlackUrl(newChannelUrl);
		const isNameValid = isValidChannelName(newChannelName);

		// Mark fields as blurred to show errors
		setHasBlurredModalUrl(true);
		setHasBlurredModalName(true);

		if (!isUrlValid || !isNameValid) {
			return;
		}

		onSubmit({ url: newChannelUrl, name: newChannelName, default: newChannelDefault });
	};

	const isModalUrlValid = isValidSlackUrl(newChannelUrl);
	const isModalNameValid = isValidChannelName(newChannelName);
	const showModalUrlError = hasBlurredModalUrl && !isModalUrlValid;
	const showModalNameError = hasBlurredModalName && !isModalNameValid;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Add Slack Channel"
			centered
		>
			<div className="flex flex-col gap-4">
				<div>
					<p>Slack Channel URL</p>
					<Space h={2} />
					<p className="text-xs opacity-50">Grab the channel URL from your browser - don&apos;t use the shareable link created by Slack</p>
					<Space h="xs" />
					<TextInput
						// label="Slack Channel URL"
						placeholder="https://app.slack.com/client/..."
						value={newChannelUrl}
						onChange={e => setNewChannelUrl(e.target.value)}
						onBlur={() => setHasBlurredModalUrl(true)}
						error={showModalUrlError ? 'Invalid Slack URL. Example: https://app.slack.com/client/T015X7RTX70/C0A7LL1Q5ED' : null}
						data-qa="modal-channel-url-input"
					/>
				</div>
				<div>
					<p>Channel Name</p>
					<Space h={2} />
					<p className="text-xs opacity-50">This is for your reference only - doesn&apos;t need to be the same as the actual channel name</p>
					<Space h="xs" />
					<TextInput
						placeholder="Channel name"
						value={newChannelName}
						onChange={e => setNewChannelName(e.target.value)}
						onBlur={() => setHasBlurredModalName(true)}
						error={showModalNameError ? 'Channel name is required' : null}
						data-qa="modal-channel-name-input"
					/>
				</div>
				<div>
					<Checkbox
						label="Set as default channel"
						checked={newChannelDefault}
						onChange={e => setNewChannelDefault(e.target.checked)}
						data-qa="modal-channel-default-checkbox"
					/>
				</div>
				<div className="flex justify-end gap-2">
					<Button variant="default" onClick={onClose}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						data-qa="modal-submit-channel-btn"
					>
						Add Channel
					</Button>
				</div>
			</div>
		</Modal>
	);
}

function ChannelInput({
	channelUrl,
	channelName,
	isDefault,
	index,
	filterKey,
	onUpdate,
	onRemove,
	onToggleDefault,
	autoFocus,
}: {
	channelUrl: string
	channelName: string
	isDefault: boolean
	index: number
	filterKey: number
	onUpdate: (index: number, field: 'url' | 'name', value: string) => void
	onRemove: (index: number) => void
	onToggleDefault: (index: number) => void
	autoFocus?: boolean
}) {
	const [localUrl, setLocalUrl] = useState(channelUrl);
	const [localName, setLocalName] = useState(channelName);
	// Show errors immediately if initial values are invalid (e.g., after page refresh)
	const [hasBlurredUrl, setHasBlurredUrl] = useState(!isValidSlackUrl(channelUrl));
	const [hasBlurredName, setHasBlurredName] = useState(!isValidChannelName(channelName));

	const isUrlValid = isValidSlackUrl(localUrl);
	const isNameValid = isValidChannelName(localName);
	const showUrlError = hasBlurredUrl && !isUrlValid;
	const showNameError = hasBlurredName && !isNameValid;
	const showError = showUrlError || showNameError;

	// Sync local state when external values change
	useEffect(() => {
		setLocalUrl(channelUrl);
	}, [channelUrl]);

	useEffect(() => {
		setLocalName(channelName);
	}, [channelName]);

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setLocalUrl(value);
		// Only update store if URL is valid
		if (isValidSlackUrl(value)) {
			onUpdate(index, 'url', value);
		}
	};

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setLocalName(value);
		// Only update store if name is valid (non-empty)
		if (isValidChannelName(value)) {
			onUpdate(index, 'name', value);
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
				'group flex items-center overflow-hidden border',
				index === 0 ? 'rounded-t-lg border-t' : 'border-t-0',
				'last:rounded-b-lg',
				showError
					? 'border-red-400/50 bg-red-500/5 hover:bg-red-500/10 dark:border-red-400/30'
					: 'border-black/10 bg-black/3 hover:bg-black/8 dark:border-white/10 dark:bg-white/5 hover:dark:bg-white/8',
			)}
		>
			<div className="flex w-full items-center">
				<TextInput
					autoFocus={autoFocus}
					variant="unstyled"
					value={localUrl}
					onChange={handleUrlChange}
					onBlur={() => setHasBlurredUrl(true)}
					placeholder="https://app.slack.com/client/..."
					className="w-full px-3"
					data-qa={`channel-url-input-${index}`}
				/>
				{showUrlError && (
					<Tooltip label="Invalid Slack URL. Example: https://app.slack.com/client/T015X7RTX70/C0A7LL1Q5ED" openDelay={0}>
						<IconExclamationCircle className="mr-2 size-4 shrink-0 text-red-400" />
					</Tooltip>
				)}
			</div>
			<div className="flex w-full items-center border-l" style={{ borderLeftColor: 'var(--mantine-color-default-border)' }}>
				<TextInput
					variant="unstyled"
					value={localName}
					onChange={handleNameChange}
					onBlur={() => setHasBlurredName(true)}
					placeholder="Channel name"
					className="w-full px-3"
					data-qa={`channel-name-input-${index}`}
				/>
				{showNameError && (
					<Tooltip label="Channel name is required" openDelay={0}>
						<IconExclamationCircle className="mr-2 size-4 shrink-0 text-red-400" />
					</Tooltip>
				)}
			</div>
			<div className="flex items-center self-stretch border-l px-3" style={{ borderLeftColor: 'var(--mantine-color-default-border)' }}>
				<Checkbox
					classNames={{ input: '!rounded-md' }}
					size="xs"
					checked={isDefault}
					onChange={() => onToggleDefault(index)}
					aria-label="Set as default channel"
				/>
			</div>
			<ActionIcon
				className="mr-2 p-2 opacity-0 transition-opacity group-hover:opacity-100"
				onClick={() => onRemove(index)}
				color="red"
				size="sm"
				aria-label="Remove channel"
				variant="subtle"
			>
				<TrashIcon className="size-3" />
			</ActionIcon>
		</motion.div>
	);
}

function PRMessageSettings(
	{ isTutorialPage = false }: { isTutorialPage?: boolean },
) {
	const copyPRMessage = useValue(settings$.copy_pr_message);
	const enableSendPRMessage = useValue(settings$.enable_send_pr_message);
	const autoSubmitPRMessage = useValue(settings$.auto_submit_pr_message);
	const prMessageChannels = useValue(settings$.pr_message_channels);

	// Add channel modal state
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

	// Track stable IDs for each channel (needed for proper exit animations)
	const channelIdsRef = useRef<number[]>([]);
	while (channelIdsRef.current.length < prMessageChannels.length) {
		channelIdsRef.current.push(channelIdCounter++);
	}

	const canAddChannel = prMessageChannels.length < MAX_CHANNELS;

	const openAddChannelModal = () => {
		if (!canAddChannel) return;
		const hasEmpty = prMessageChannels.some(c => c.url === '' || !c.name || c.name.trim() === '');
		if (hasEmpty) {
			return;
		}
		openModal();
	};

	const handleSubmitNewChannel = (channel: { url: string, name: string, default: boolean }) => {
		// Automatically enable the checkbox when adding a channel
		settings$.enable_send_pr_message.set(true);
		const newChannels = [...prMessageChannels, channel];
		settings$.pr_message_channels.set(newChannels);
		closeModal();
	};

	const removeChannel = (index: number) => {
		channelIdsRef.current.splice(index, 1);
		const newChannels = prMessageChannels.filter((_, i) => i !== index);
		settings$.pr_message_channels.set(newChannels);
		// If this was the last channel, disable the checkbox
		if (newChannels.length === 0) {
			settings$.enable_send_pr_message.set(false);
		}
	};

	const updateChannel = (index: number, field: 'url' | 'name', value: string) => {
		const newChannels = [...prMessageChannels];
		newChannels[index] = { ...newChannels[index], [field]: value };
		settings$.pr_message_channels.set(newChannels);
	};

	const toggleDefault = (index: number) => {
		const clickedChannel = prMessageChannels[index];
		const newChannels = prMessageChannels.map((channel, i) => ({
			...channel,
			// If clicking on already-default channel, toggle it off
			// Otherwise, set clicked channel to default and all others to non-default
			default: clickedChannel.default ? false : i === index,
		}));
		settings$.pr_message_channels.set(newChannels);
	};

	return (
		<>
			{/* Add Channel Modal */}
			<AddSlackChannelModal
				opened={modalOpened}
				onClose={closeModal}
				onSubmit={handleSubmitNewChannel}
			/>

			{/* PR Message Template */}
			<PRMessageTemplateEditor />

			{/* Copy PR messages */}
			<Checkbox
				label="Copy PR messages"
				id="copyPRMessage"
				data-qa="setting-copy-pr-message"
				checked={copyPRMessage}
				onChange={e => settings$.copy_pr_message.set(e.target.checked)}
			/>
			<Space h="xs" />

			{/* Send PR message to Slack */}
			<div className={clsx(
				'flex items-center',
				isTutorialPage ? 'gap-4' : 'justify-between',
			)}
			>
				<Checkbox
					label="Send PR message to Slack"
					id="sendPRMessageToSlack"
					data-qa="setting-send-pr-message-to-slack"
					checked={enableSendPRMessage}
					onChange={(e) => {
						const isChecked = e.target.checked;
						// If checking and there are no channels, open the modal instead
						if (isChecked && prMessageChannels.length === 0) {
							openModal();
						} else {
							settings$.enable_send_pr_message.set(isChecked);
						}
					}}
				/>
				<Tooltip label={!canAddChannel ? `You cannot add more than ${MAX_CHANNELS} channel mappings` : 'Add a Slack channel mapping'}>
					<Button
						variant="light"
						size="compact-xs"
						onClick={openAddChannelModal}
						disabled={!canAddChannel || prMessageChannels.some(c => c.url === '' || !c.name || c.name.trim() === '')}
						data-qa="add-channel-btn"
					>
						<div className="flex items-center gap-1">
							<PlusIcon size={16} />
							Slack Channel
						</div>
					</Button>
				</Tooltip>
			</div>

			{/* Channel List Section - Shown when send PR message is enabled */}
			<AnimatePresence initial={false}>
				{enableSendPRMessage && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
						className="overflow-hidden"
					>
						<AnimatePresence initial={false}>
							{prMessageChannels.length > 0 && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: 'auto', opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.15, ease: 'easeOut' }}
									className="overflow-hidden"
								>
									<Space h="md" />
									<div className="mb-1 ml-1 flex items-center gap-2 text-xs font-medium text-black/50 dark:text-white/50">
										<div className="flex-1">Channel URL</div>
										<div className="flex-1">Channel Name</div>
										<div className="w-[40px] text-center">Default</div>
										<div className="w-[25px]" /> {/* Spacer for delete button */}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
						<div className="flex w-full flex-col">
							<AnimatePresence initial={false}>
								{prMessageChannels.map((channelData, index) => (
									<ChannelInput
										key={channelIdsRef.current[index]}
										channelUrl={channelData.url}
										channelName={channelData.name}
										isDefault={channelData.default}
										index={index}
										filterKey={channelIdsRef.current[index]}
										onUpdate={updateChannel}
										onRemove={removeChannel}
										onToggleDefault={toggleDefault}
										autoFocus={channelData.url === '' && index === prMessageChannels.length - 1}
									/>
								))}
							</AnimatePresence>
						</div>
						<Space h="sm" />
						<Checkbox
							classNames={{ input: '!rounded-md' }}
							size="xs"
							label="Automatically submit the message. When unchecked, the message will only be filled into the Slack message field."
							id="autoSubmitPRMessage"
							data-qa="setting-auto-submit-pr-message"
							checked={autoSubmitPRMessage}
							onChange={e => settings$.auto_submit_pr_message.set(e.target.checked)}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}

export default PRMessageSettings;

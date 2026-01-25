/* eslint-disable better-tailwindcss/no-unregistered-classes */
import { useValue } from '@legendapp/state/react';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

import { COPY_BTN_RESET_DELAY } from '@/utils/constants';
import { copyPRMessageToClipboard, sendPRMessageToSlack } from '@/utils/pr';
import { settings$, SlackChannel } from '@/utils/store';
import { withStorageLoaded } from '@/utils/utils';

const BASE_GITHUB_BTN_CLASS = 'js-title-edit-button flex-md-order-2 Button--secondary Button--small Button mr-md-0 m-0';

const SlackLogo = () => (
	<div style={{ width: '14px', height: '14px', display: 'inline-block' }}>
		<svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M36.4 56.2C36.4 63.5 30.5 69.4 23.2 69.4C15.9 69.4 10 63.5 10 56.2C10 48.9 15.9 43 23.2 43H36.4V56.2Z" fill="#E01E5A" />
			<path d="M23.2 36.4C15.9 36.4 10 30.5 10 23.2C10 15.9 15.9 10 23.2 10C30.5 10 36.4 15.9 36.4 23.2V36.4H23.2Z" fill="#36C5F0" />
			<path d="M43 23.2C43 15.9 48.9 10 56.2 10C63.5 10 69.4 15.9 69.4 23.2C69.4 30.5 63.5 36.4 56.2 36.4H43V23.2Z" fill="#2EB67D" />
			<path d="M56.2 43C63.5 43 69.4 48.9 69.4 56.2C69.4 63.5 63.5 69.4 56.2 69.4C48.9 69.4 43 63.5 43 56.2V43H56.2Z" fill="#ECB22E" />
		</svg>
	</div>
);

const DropdownIcon = () => (
	<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="octicon octicon-triangle-down">
		<path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"></path>
	</svg>
);

function SendPRButtonGitHub() {
	const channels = useValue(settings$.pr_message_channels);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Determine button state
	const defaultChannel = channels.find(c => c.default);
	const hasMultipleChannels = channels.length > 1;
	const hasSingleChannel = channels.length === 1;

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};

		if (isDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [isDropdownOpen]);

	const handleDropdownToggle = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	const handleChannelSelect = async (channel: SlackChannel) => {
		await sendPRMessageToSlack({ platform: 'github', channel });
		setIsDropdownOpen(false);
	};

	const handleSendToChannel = async (channel: SlackChannel) => {
		await sendPRMessageToSlack({ platform: 'github', channel });
	};

	return (
		<div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
			{/* State 1: Single channel - show logo + channel name, sends message */}
			{hasSingleChannel && (
				<button onClick={() => handleSendToChannel(channels[0])} className={BASE_GITHUB_BTN_CLASS}>
					<SlackLogo />
					<span>#{channels[0].name}</span>
				</button>
			)}

			{/* State 2: Multiple channels, no default - only logo, opens dropdown */}
			{hasMultipleChannels && !defaultChannel && (
				<button onClick={handleDropdownToggle} className={BASE_GITHUB_BTN_CLASS}>
					<SlackLogo />
				</button>
			)}

			{/* State 3: Multiple channels with default - split button */}
			{hasMultipleChannels && defaultChannel && (
				<div style={{ display: 'flex' }}>
					<button
						onClick={() => handleSendToChannel(defaultChannel)}
						className={BASE_GITHUB_BTN_CLASS}
						style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
					>
						<SlackLogo />
						<span>#{defaultChannel.name}</span>
					</button>
					<button
						onClick={handleDropdownToggle}
						className={BASE_GITHUB_BTN_CLASS}
						style={{
							borderTopLeftRadius: 0,
							borderBottomLeftRadius: 0,
							borderLeft: 'var(--button-default-borderColor-rest)',
							paddingLeft: '8px',
							paddingRight: '8px',
						}}
					>
						<DropdownIcon />
					</button>
				</div>
			)}

			{/* Dropdown menu */}
			{isDropdownOpen && (
				<div
					className="Overlay-body Overlay-body--paddingNone"
					style={{
						position: 'absolute',
						top: 'calc(100% + 8px)',
						right: 0,
						zIndex: 9999,
						minWidth: '200px',
						backgroundColor: 'var(--overlay-bgColor, var(--color-canvas-overlay))',
						borderRadius: 'var(--borderRadius-large, .75rem)',
						boxShadow: 'var(--shadow-floating-small, var(--color-overlay-shadow))',
						padding: '8px',
						maxHeight: '300px',
						overflowY: 'auto',
					}}
				>
					<ul className="ActionListWrap">
						{channels
							.filter(channel => !defaultChannel || channel.url !== defaultChannel.url)
							.map((channel, index) => (
								<li
									key={index}
									onClick={() => handleChannelSelect(channel)}
									className="ActionListItem"
								>
									<div
										className="ActionListContent ActionListContent--visual16"
									>
										<span className="ActionListItem-visual ActionListItem-visual--leading">#</span>
										<span className="ActionListItem-label">{channel.name}</span>
									</div>
								</li>
							))}
					</ul>
				</div>
			)}
		</div>
	);
}

function CopyPRButtonGitHub() {
	const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

	const handleCopyClick = async () => {
		const success = await copyPRMessageToClipboard({ platform: 'github' });
		if (!success) return;

		setCopyState('copied');
		setTimeout(() => {
			setCopyState('idle');
		}, COPY_BTN_RESET_DELAY);
	};

	return (
		<button onClick={handleCopyClick} className={BASE_GITHUB_BTN_CLASS}>
			{copyState === 'idle' && <IconCopy size={12} />}
			{copyState === 'copied' && <IconCheck size={12} />}
		</button>
	);
}

function PRButtonsGitHub() {
	const copyPRMessageEnabled = useValue(settings$.copy_pr_message);
	const sendPRMessageEnabled = useValue(settings$.enable_send_pr_message);
	const channels = useValue(settings$.pr_message_channels);

	return (
		<>
			{sendPRMessageEnabled && channels.length > 0 && <SendPRButtonGitHub />}
			{copyPRMessageEnabled && <CopyPRButtonGitHub />}
		</>
	);
}

export default withStorageLoaded(PRButtonsGitHub);

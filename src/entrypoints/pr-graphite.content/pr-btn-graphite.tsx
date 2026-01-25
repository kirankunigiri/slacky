/* eslint-disable better-tailwindcss/no-unregistered-classes */
import { useValue } from '@legendapp/state/react';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { COPY_BTN_RESET_DELAY } from '@/utils/constants';
import { copyPRMessageToClipboard, sendPRMessageToSlack } from '@/utils/pr';
import { settings$, SlackChannel } from '@/utils/store';
import { withStorageLoaded } from '@/utils/utils';

/**
 * Finds the Graphite button classname dynamically from the DOM.
 * Graphite uses CSS modules with pattern like "Button_gdsButton__SadwL"
 *
 * @returns The full classname with the hash suffix, or empty string if not found
 */
function findGraphiteButtonClass(name: string): string {
	try {
		// Find any element with a class containing "Button_gdsButton__"
		const element = document.querySelector(`[class*="${name}"]`);

		if (!element) {
			console.warn('Graphite button class not found');
			return '';
		}

		// Get all classnames from the element
		const classList = element.classList;

		// Find the specific class that matches the pattern "Button_gdsButton__XXXXX"
		for (const className of classList) {
			if (className.startsWith(name)) {
				return className;
			}
		}

		console.warn(`${name} class not found in element`);
		return '';
	} catch (error) {
		console.error('Error finding Graphite button class:', error);
		return '';
	}
}

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
	<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="Icon_icon__yrECt" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M12.3536 5.64645C12.1583 5.45118 11.8417 5.45118 11.6464 5.64645L8 9.29289L4.35355 5.64645C4.15829 5.45118 3.84171 5.45118 3.64645 5.64645C3.45118 5.84171 3.45118 6.15829 3.64645 6.35355L7.64645 10.3536L8 10.7071L8.35355 10.3536L12.3536 6.35355C12.5488 6.15829 12.5488 5.84171 12.3536 5.64645Z"></path></svg>
);

function SendPRButtonGraphite({ buttonClass }: { buttonClass: string }) {
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
		await sendPRMessageToSlack({ platform: 'graphite', channel });
		setIsDropdownOpen(false);
	};

	const handleSendToChannel = async (channel: SlackChannel) => {
		await sendPRMessageToSlack({ platform: 'graphite', channel });
	};

	return (
		<div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
			{/* State 1: Single channel - show logo + channel name, sends message */}
			{hasSingleChannel && (
				<button onClick={() => handleSendToChannel(channels[0])} className={buttonClass} style={{ height: '100%' }}>
					<SlackLogo />
					<span>#{channels[0].name}</span>
				</button>
			)}

			{/* State 2: Multiple channels, no default - only logo, opens dropdown */}
			{hasMultipleChannels && !defaultChannel && (
				<button onClick={handleDropdownToggle} className={buttonClass} style={{ height: '100%' }}>
					<SlackLogo />
				</button>
			)}

			{/* State 3: Multiple channels with default - split button */}
			{hasMultipleChannels && defaultChannel && (
				<div style={{ display: 'flex', height: '100%' }}>
					<button
						data-priority="secondary"
						onClick={() => handleSendToChannel(defaultChannel)}
						className={buttonClass}
						style={{ borderTopRightRadius: 0,
							borderBottomRightRadius: 0, height: '100%', borderRight: 'none' }}
					>
						<SlackLogo />
						<span>#{defaultChannel.name}</span>
					</button>
					<button
						data-priority="secondary"
						onClick={handleDropdownToggle}
						className={buttonClass}
						style={{
							borderTopLeftRadius: 0,
							borderBottomLeftRadius: 0,
							paddingLeft: '8px',
							paddingRight: '8px',
							height: '100%',
						}}
					>
						<DropdownIcon />
					</button>
				</div>
			)}

			{/* Dropdown menu */}
			{isDropdownOpen && (
				<div
					style={{
						position: 'absolute',
						top: 'calc(100% + 6px)',
						right: 0,
						zIndex: 9999,
						minWidth: '240px',
						maxHeight: '400px',
						overflowY: 'auto',
						backgroundColor: 'var(--color-bg-light)',
						border: '1px solid var(--border-color-default)',
						borderRadius: 'var(--gds-radius-m)',
						padding: 'var(--gds-space-xs)',
						boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)',
					}}
				>
					{channels
						.filter(channel => !defaultChannel || channel.url !== defaultChannel.url)
						.map((channel, index) => (
							<div
								key={index}
								onClick={() => handleChannelSelect(channel)}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--gds-space-xs)',
									padding: '6px 8px',
									borderRadius: 'var(--gds-radius-s)',
									cursor: 'pointer',
									transition: 'background-color 0.15s ease',
									color: 'var(--text-color-primary)',
									fontSize: '14px',
									lineHeight: '20px',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = 'var(--btn-color-neutral-hover)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = 'transparent';
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										width: '16px',
										height: '16px',
										flexShrink: 0,
										opacity: 0.8,
									}}
								>
									<span style={{ fontSize: '16px', fontWeight: 600 }}>#</span>
								</div>
								<span style={{ flex: 1 }}>{channel.name}</span>
							</div>
						))}
				</div>
			)}
		</div>
	);
}

function CopyPRButtonGraphite({ buttonClass }: { buttonClass: string }) {
	const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

	const handleCopyClick = async () => {
		const success = await copyPRMessageToClipboard({ platform: 'graphite' });
		if (!success) return;

		setCopyState('copied');
		setTimeout(() => {
			setCopyState('idle');
		}, COPY_BTN_RESET_DELAY);
	};

	return (
		<button
			onClick={handleCopyClick}
			className={buttonClass}
			data-priority="tertiary"
		>
			{copyState === 'idle' && <IconCopy size={12} />}
			{copyState === 'copied' && <IconCheck size={12} />}
		</button>
	);
}

function PRButtonsGraphite() {
	const copyPRMessageEnabled = useValue(settings$.copy_pr_message);
	const sendPRMessageEnabled = useValue(settings$.enable_send_pr_message);
	const channels = useValue(settings$.pr_message_channels);
	const showChannelButton = sendPRMessageEnabled && channels.length > 0;

	// Find the Graphite button class dynamically when component mounts
	// DOM is guaranteed to be ready at this point
	const buttonClass = useMemo(() => findGraphiteButtonClass('Button_gdsButton__'), []);
	const separatorClass = useMemo(() => findGraphiteButtonClass('Separator_gdsSeparator__'), []);

	return (
		<>
			{showChannelButton && <SendPRButtonGraphite buttonClass={buttonClass} />}
			{copyPRMessageEnabled && <CopyPRButtonGraphite buttonClass={buttonClass} />}
			{(showChannelButton || copyPRMessageEnabled) && (
				<hr role="separator" aria-orientation="vertical" className={separatorClass} style={{ marginRight: '8px' }} />
			)}
		</>
	);
}

export default withStorageLoaded(PRButtonsGraphite);

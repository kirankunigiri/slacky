import { useValue } from '@legendapp/state/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import { getBackgroundService } from '@/utils/messaging';
import { settings$ } from '@/utils/store';
import { withStorageLoaded } from '@/utils/utils';
import { browser } from '#imports';

const MODAL_ANIMATION_MS = 100;

/** The iframe takes a bit to load, so we wait a bit before starting the animation */
const IFRAME_LOAD_DELAY_MS = 200;

function SettingsButton() {
	const showSettingsButtonInSlack = useValue(settings$.show_settings_button_in_slack);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);

	const handleClose = () => {
		setIsAnimating(false);
		setTimeout(() => setIsModalOpen(false), MODAL_ANIMATION_MS); // Wait for animation to complete
	};

	const handleOpen = () => {
		setIsModalOpen(true);
		setTimeout(() => setIsAnimating(true), IFRAME_LOAD_DELAY_MS);
		getBackgroundService().trackEvent({
			eventName: 'slacky_button_clicked',
		});
	};

	if (!showSettingsButtonInSlack) return null;

	return (
		<>
			<button
				style={{ marginRight: '4px' }}
				// eslint-disable-next-line better-tailwindcss/no-unregistered-classes
				className="c-button-unstyled p-top_nav__button p-top_nav__help"
				data-qa="slacky-settings-button"
				aria-label="Slacky Settings"
				data-sk="tooltip_parent"
				type="button"
				tabIndex={-1}
				onClick={handleOpen}
			>
				<div style={{ width: '20px', height: '20px', display: 'inline-block' }}>
					<svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M36.4 56.2C36.4 63.5 30.5 69.4 23.2 69.4C15.9 69.4 10 63.5 10 56.2C10 48.9 15.9 43 23.2 43H36.4V56.2Z" fill="#E01E5A" />
						<path d="M23.2 36.4C15.9 36.4 10 30.5 10 23.2C10 15.9 15.9 10 23.2 10C30.5 10 36.4 15.9 36.4 23.2V36.4H23.2Z" fill="#36C5F0" />
						<path d="M43 23.2C43 15.9 48.9 10 56.2 10C63.5 10 69.4 15.9 69.4 23.2C69.4 30.5 63.5 36.4 56.2 36.4H43V23.2Z" fill="#2EB67D" />
						<path d="M56.2 43C63.5 43 69.4 48.9 69.4 56.2C69.4 63.5 63.5 69.4 56.2 69.4C48.9 69.4 43 63.5 43 56.2V43H56.2Z" fill="#ECB22E" />
					</svg>
				</div>

				{/* Original Help Icon */}
				{/* <svg
					data-i0m="true"
					data-qa="help-icon"
					aria-hidden="true"
					viewBox="0 0 20 20"
					className=""
					style={{ '--s': '20px' } as React.CSSProperties}
				>
					<path
						fill="currentColor"
						fillRule="evenodd"
						d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15M1 10a9 9 0 1 1 18 0 9 9 0 0 1-18 0m7.883-2.648c-.23.195-.383.484-.383.898a.75.75 0 0 1-1.5 0c0-.836.333-1.547.91-2.04.563-.48 1.31-.71 2.09-.71.776 0 1.577.227 2.2.729.642.517 1.05 1.294 1.05 2.271 0 .827-.264 1.515-.807 2.001-.473.423-1.08.623-1.693.703V12h-1.5v-1c0-.709.566-1.211 1.18-1.269.507-.048.827-.18 1.013-.347.162-.145.307-.39.307-.884 0-.523-.203-.87-.492-1.104C10.951 7.148 10.502 7 10 7c-.497 0-.876.146-1.117.352M10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
						clipRule="evenodd"
					>
					</path>
				</svg> */}
			</button>

			{isModalOpen && createPortal(
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
						backgroundColor: isAnimating ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0)',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						zIndex: 9999999999999,
						transition: `background-color ${MODAL_ANIMATION_MS}ms ease-in-out`,
					}}
					onClick={handleClose}
				>
					<div
						style={{
							// Extra 2px needed on height/width to remove iframe scrollbars. Alternatively set overflow:hidden on the body
							width: '422px',
							height: '502px',
							overflow: 'hidden',
							position: 'relative',
							boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
							transform: isAnimating ? 'scale(1)' : 'scale(0.9)',
							opacity: isAnimating ? 1 : 0,
							transition: `transform ${MODAL_ANIMATION_MS}ms ease-in-out, opacity ${MODAL_ANIMATION_MS}ms ease-in-out`,
						}}
						onClick={e => e.stopPropagation()}
					>
						{/* <button
							style={{
								position: 'absolute',
								top: '10px',
								right: '10px',
								background: 'none',
								border: 'none',
								fontSize: '24px',
								cursor: 'pointer',
								zIndex: 1,
								color: '#666',
								padding: '5px 10px',
							}}
							onClick={() => setIsModalOpen(false)}
						>
							×
						</button> */}
						<iframe
							src={browser.runtime.getURL('/settings.html')}
							style={{
								width: '100%',
								height: '100%',
								border: '1px solid #404040',
								borderRadius: '8px',
								backgroundColor: 'none',
								overflow: 'hidden',
							}}
							title="Slacky Settings"
						/>
					</div>
				</div>,
				document.body,
			)}
		</>
	);
}

export default withStorageLoaded(SettingsButton);

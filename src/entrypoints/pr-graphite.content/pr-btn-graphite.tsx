import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useState } from 'react';

import { COPY_BTN_RESET_DELAY } from '@/utils/constants';
import { copyPRMessageGitHub } from '@/utils/pr';
import { withStorageLoaded } from '@/utils/utils';

const BASE_GRAPHITE_BTN_CLASS = 'Button_gdsButton__SadwL TitleBarActions_reviewChangesAction__TFaXJ';

function PRButtonGraphite() {
	const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

	const handleClick = () => {
		console.log('Open PR');
	};

	const handleCopyClick = async () => {
		// await copyPRMessageGitHub(); TODO: Implement graphite version
		setCopyState('copied');
		setTimeout(() => {
			setCopyState('idle');
		}, COPY_BTN_RESET_DELAY);
	};

	return (
		<>
			{/* Send message in Slack */}
			<button onClick={handleClick} className={BASE_GRAPHITE_BTN_CLASS}>
				<div style={{ width: '14px', height: '14px', display: 'inline-block' }}>
					<svg width="100%" height="100%" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M36.4 56.2C36.4 63.5 30.5 69.4 23.2 69.4C15.9 69.4 10 63.5 10 56.2C10 48.9 15.9 43 23.2 43H36.4V56.2Z" fill="#E01E5A" />
						<path d="M23.2 36.4C15.9 36.4 10 30.5 10 23.2C10 15.9 15.9 10 23.2 10C30.5 10 36.4 15.9 36.4 23.2V36.4H23.2Z" fill="#36C5F0" />
						<path d="M43 23.2C43 15.9 48.9 10 56.2 10C63.5 10 69.4 15.9 69.4 23.2C69.4 30.5 63.5 36.4 56.2 36.4H43V23.2Z" fill="#2EB67D" />
						<path d="M56.2 43C63.5 43 69.4 48.9 69.4 56.2C69.4 63.5 63.5 69.4 56.2 69.4C48.9 69.4 43 63.5 43 56.2V43H56.2Z" fill="#ECB22E" />
					</svg>
				</div>
			</button>

			{/* Copy PR Message */}
			<button onClick={handleCopyClick} className={BASE_GRAPHITE_BTN_CLASS}>
				{copyState === 'idle' && <IconCopy size={12} />}
				{copyState === 'copied' && <IconCheck size={12} />}
			</button>
		</>
	);
}

export default withStorageLoaded(PRButtonGraphite);

import '@/assets/index.css';
import '@/assets/tailwind.css';
import '@/theme/style.css';

import { MantineProvider } from '@mantine/core';
import React from 'react';

import App from '@/entrypoints/popup/App';
import { shadcnCssVariableResolver } from '@/theme/cssVariablerResolver.ts';
import { shadcnTheme } from '@/theme/theme.tsx';

export function BaseApp() {
	return (
		<React.StrictMode>
			<MantineProvider
				theme={shadcnTheme}
				cssVariablesResolver={shadcnCssVariableResolver}
			>
				<App />
			</MantineProvider>
		</React.StrictMode>
	);
}

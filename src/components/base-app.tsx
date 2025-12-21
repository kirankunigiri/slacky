import '@/assets/index.css';
import '@/assets/tailwind.css';
import '@/theme/style.css';

import { MantineProvider } from '@mantine/core';
import React from 'react';
import { scan } from 'react-scan';

import App from '@/components/app';
import { shadcnCssVariableResolver } from '@/theme/cssVariablerResolver.ts';
import { shadcnTheme } from '@/theme/theme.tsx';

scan({ enabled: true });

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

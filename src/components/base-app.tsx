import { MantineProvider } from '@mantine/core';
import React from 'react';
import { scan } from 'react-scan'; // TODO: conditionally import

import App from '@/components/app';
import { shadcnCssVariableResolver } from '@/theme/cssVariablerResolver.ts';
import { shadcnTheme } from '@/theme/theme.tsx';
import { AnalyticsProvider } from '@/utils/analytics';

scan({ enabled: import.meta.env.MODE === 'development' });

export function BaseApp() {
	return (
		<React.StrictMode>
			<AnalyticsProvider>
				<MantineProvider
					defaultColorScheme="dark"
					theme={shadcnTheme}
					cssVariablesResolver={shadcnCssVariableResolver}
				>
					<App />
				</MantineProvider>
			</AnalyticsProvider>
		</React.StrictMode>
	);
}

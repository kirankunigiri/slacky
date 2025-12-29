import { MantineProvider } from '@mantine/core';
import React from 'react';
import { scan } from 'react-scan'; // TODO: conditionally import

import { shadcnCssVariableResolver } from '@/theme/cssVariablerResolver.ts';
import { shadcnTheme } from '@/theme/theme.tsx';
import { AnalyticsProvider } from '@/utils/analytics';

scan({ enabled: import.meta.env.MODE === 'development' });

export function BaseApp({ children }: { children: React.ReactNode }) {
	return (
		<React.StrictMode>
			<AnalyticsProvider>
				<MantineProvider
					defaultColorScheme="dark"
					theme={shadcnTheme}
					cssVariablesResolver={shadcnCssVariableResolver}
				>
					{children}
				</MantineProvider>
			</AnalyticsProvider>
		</React.StrictMode>
	);
}

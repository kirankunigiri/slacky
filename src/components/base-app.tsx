import { MantineProvider } from '@mantine/core';
import React from 'react';

import { shadcnCssVariableResolver } from '@/theme/cssVariablerResolver.ts';
import { shadcnTheme } from '@/theme/theme.tsx';
import { AnalyticsProvider } from '@/utils/analytics';

if (import.meta.env.DEV) {
	import('react-scan').then(({ scan }) => scan({ enabled: true }));
}

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

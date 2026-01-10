import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import React, { lazy, Suspense } from 'react';

import { shadcnCssVariableResolver } from '@/theme/cssVariablerResolver.ts';
import { shadcnTheme } from '@/theme/theme.tsx';
import { AnalyticsProvider } from '@/utils/analytics';

/** react-scan is broken in firefox (it freezes the page) */
if (import.meta.env.DEV && import.meta.env.BROWSER === 'chrome') {
	import('react-scan').then(({ scan }) => scan({ enabled: true }));
}

const DevInspector = import.meta.env.DEV ? lazy(() => import('@/components/dev-inspector')) : null;

export function BaseApp({ children }: { children: React.ReactNode }) {
	return (
		<React.StrictMode>
			{import.meta.env.DEV && (
				<Suspense fallback={null}>
					{DevInspector && <DevInspector />}
				</Suspense>
			)}
			<AnalyticsProvider>
				<MantineProvider
					defaultColorScheme="dark"
					theme={shadcnTheme}
					cssVariablesResolver={shadcnCssVariableResolver}
				>
					<ModalsProvider>
						<div className="flex justify-center">
							{children}
						</div>
					</ModalsProvider>
				</MantineProvider>
			</AnalyticsProvider>
		</React.StrictMode>
	);
}

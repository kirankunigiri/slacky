import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { PostHogErrorBoundary, PostHogProvider } from 'posthog-js/react';
import React, { lazy, Suspense } from 'react';

import { shadcnCssVariableResolver } from '@/theme/cssVariablerResolver.ts';
import { shadcnTheme } from '@/theme/theme.tsx';
import { DISABLE_ANALYTICS, ph, setupPostHog } from '@/utils/analytics';

setupPostHog({ type: 'ui' });

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

/** React provider for PostHog */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
	if (DISABLE_ANALYTICS) {
		console.log('Analytics disabled');
		return (
			<ErrorFallback>
				{children}
			</ErrorFallback>
		);
	}

	return (
		// @ts-expect-error - PostHogProvider is not type compatible with PostHog client from module.no-external
		<PostHogProvider client={ph}>
			<ErrorFallback>
				{children}
			</ErrorFallback>
		</PostHogProvider>
	);
}

function ErrorFallback({ children }: { children: React.ReactNode }) {
	return (
		<PostHogErrorBoundary fallback={(
			<div className="flex flex-col items-center gap-4 p-4 text-center">
				<div>
					<p className="text-red-600">Slacky has crashed.</p>
					<a
						className="hover:underline"
						href="https://github.com/kirankunigiri/slacky/issues/new/choose"
						target="_blank"
						rel="noreferrer"
					>
						Please file an issue on{' '}
						<span className="text-blue-500">GitHub</span>
					</a>
				</div>
				<button
					onClick={() => window.location.reload()}
					className="cursor-pointer rounded-full bg-blue-700 px-4 py-1 text-xs! text-white hover:bg-blue-800"
				>
					Restart
				</button>
			</div>
		)}
		>
			{children}
		</PostHogErrorBoundary>
	);
}

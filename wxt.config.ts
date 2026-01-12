import { inspectorServer } from '@react-dev-inspector/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'wxt';

const isTestBuild = process.env.VITE_IS_TEST_BUILD === 'true';
// Detect if we're running `wxt build` (not `wxt prepare` or `wxt dev`)
const isBuildCommand = process.argv.includes('build');

// See https://wxt.dev/api/config.html
export default defineConfig({
	outDirTemplate: isTestBuild ? 'test-build' : '{{browser}}-mv{{manifestVersion}}{{modeSuffix}}',
	manifest: async ({ mode }) => {
		const isDev = mode === 'development';

		// Async import env vars since they are not available before this function
		// Validation will block wxt from starting if any env vars are incorrect
		const { clientEnv } = await import('./src/utils/client-env');
		// Only validate PostHog credentials during actual production builds, not `wxt prepare`
		if (
			isBuildCommand
			&& mode === 'production'
			&& !isTestBuild
			&& clientEnv.VITE_REQUIRE_POSTHOG_IN_PROD
			&& !clientEnv.VITE_PUBLIC_POSTHOG_HOST
			&& !clientEnv.VITE_PUBLIC_POSTHOG_KEY
		) {
			throw new Error('PostHog credentials are required in production because VITE_REQUIRE_POSTHOG_IN_PROD is true.');
		}
		const analyticsHost = clientEnv.VITE_PUBLIC_POSTHOG_HOST;

		// CSP for extension pages
		const extensionPagesCsp = isDev
			? `script-src 'self' 'wasm-unsafe-eval' http://localhost:3000; object-src 'self'; connect-src 'self' ${analyticsHost} ws://localhost:3000;`
			: `script-src 'self'; object-src 'self'; connect-src 'self' ${analyticsHost};`;

		// CSP for sandbox pages (only for dev)
		const sandboxCsp = isDev
			? `script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000; sandbox allow-scripts allow-forms allow-popups allow-modals; child-src 'self';`
			: undefined;

		return {
			version: '1.0',
			permissions: ['storage'],
			content_security_policy: {
				extension_pages: extensionPagesCsp,
				...(sandboxCsp && { sandbox: sandboxCsp }),
			},
			web_accessible_resources: [
				{
					resources: ['settings.html'],
					matches: ['*://*.slack.com/*'],
				},
			],
		};
	},
	srcDir: 'src',
	imports: {
		eslintrc: {
			enabled: 9,
		},
	},
	modules: [
		'@wxt-dev/module-react',
		'@wxt-dev/auto-icons',
	],
	autoIcons: {
		enabled: true,
		baseIconPath: 'assets/icon.svg',
		developmentIndicator: 'overlay',
	},
	react: {
		vite: {
			babel: {
				plugins: [
					'@react-dev-inspector/babel-plugin',
				],
			},
		},
	},
	vite: () => ({
		plugins: [
			tailwindcss(),
			inspectorServer() as never,
		],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
		},
		// Used by the dev inspector to open the correct file in the IDE
		define: {
			'import.meta.env.VITE_PROJECT_ROOT': JSON.stringify(path.resolve(__dirname)),
		},
		// Required workaround for posthog - https://github.com/PostHog/posthog-js/issues/2604
		// Forces ASCII-safe output to prevent UTF-8 encoding errors in content scripts
		esbuild: {
			charset: 'ascii',
		},
	}),
});

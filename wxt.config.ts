import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	manifest: ({ mode }) => {
		const isDev = mode === 'development';
		const analyticsHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

		// CSP for extension pages
		const extensionPagesCsp = isDev
			? `script-src 'self' 'wasm-unsafe-eval' http://localhost:3000; object-src 'self'; connect-src 'self' ${analyticsHost} ws://localhost:3000;`
			: `script-src 'self'; object-src 'self'; connect-src 'self' ${analyticsHost};`;

		// CSP for sandbox pages (only for dev)
		const sandboxCsp = isDev
			? `script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000; sandbox allow-scripts allow-forms allow-popups allow-modals; child-src 'self';`
			: undefined;

		return {
			permissions: ['storage'],
			content_security_policy: {
				extension_pages: extensionPagesCsp,
				...(sandboxCsp && { sandbox: sandboxCsp }),
			},
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
	vite: () => ({
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
		},
	}),
});

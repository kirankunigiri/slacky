import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	manifest: {
		permissions: ['storage'],
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

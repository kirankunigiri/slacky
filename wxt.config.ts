import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: 'src',
	imports: {
		eslintrc: {
			enabled: 9,
		},
	},
	modules: ['@wxt-dev/module-react'],
});

import { execSync } from 'child_process';

/**
 * Global setup for Playwright tests
 * Builds the extension with VITE_IS_TEST_BUILD=true to disable analytics
 * Outputs to .output/test-build
 */
async function globalSetup() {
	console.log('Building extension for tests...');
	execSync('wxt build', {
		stdio: 'inherit',
		cwd: process.cwd(),
		env: {
			...process.env,
			VITE_IS_TEST_BUILD: 'true',
		},
	});
	console.log('Build finished.');
}

export default globalSetup;

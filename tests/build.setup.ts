import { execSync } from 'child_process';

/**
 * Global setup for Playwright tests
 * Builds the extension with VITE_IS_TEST_BUILD=true to disable analytics
 * Outputs to .output/test-build
 *
 * Skip build with: SKIP_BUILD=1 bun test
 */
async function globalSetup() {
	if (process.env.SKIP_BUILD) {
		console.log('Skipping build (SKIP_BUILD=1)');
		return;
	}

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

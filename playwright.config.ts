// Load .env file and validate
import 'dotenv/config';
import './tests/test-env';

import { defineConfig, devices } from '@playwright/test';

/**
 * Slack is unreliable to test with, so we allow 2 retries
 * - Sometimes may not create an attachment for a message when expected
 * - Sometimes shows an error dialog "Attachment removing failed!"
 * - Slack just doesn't load sometimes
 */

/** See https://playwright.dev/docs/test-configuration. */
export default defineConfig({
	testDir: './tests',
	globalSetup: './tests/build.setup.ts',
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry up to 2 times (3 total attempts). Passing on retry = "flaky" */
	retries: 2,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},
	/* Some tests take longer than the 30s default */
	timeout: 60000,

	/* Configure projects for major browsers */
	projects: [
		// Setup project
		{ name: 'setup', testMatch: /.*\.setup\.ts/ },

		// Playwright only supports loading extensions for Chrome. Firefox & Safari are not supported.
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				storageState: 'playwright/.auth/user.json',
			},
			dependencies: ['setup'],
		},
	],
});

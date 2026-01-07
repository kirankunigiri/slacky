import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

import { testEnv as env } from './test-env';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Authentication setup for Playwright tests
 * Skip with: SKIP_AUTH=1 bun run test
 */
setup('authenticate', async ({ page }) => {
	if (process.env.SKIP_AUTH) {
		console.log('Skipping auth (SKIP_AUTH=1)');
		return;
	}
	await page.goto(`https://${env.TEST_SLACK_WORKSPACE_NAME}.slack.com/sign_in_with_password`);

	// Wait for the page to load
	await page.waitForLoadState('networkidle');

	// Fill in email
	await page.fill('input[type="email"]', env.TEST_SLACK_EMAIL);

	// Fill in password
	await page.fill('input[type="password"]', env.TEST_SLACK_PASSWORD);

	// Click submit button
	await page.click('button[type="submit"]');

	// Wait for successful login
	await page.waitForSelector('text=Launching', { timeout: 30000 });

	// Save storage state
	await page.context().storageState({ path: authFile });
});

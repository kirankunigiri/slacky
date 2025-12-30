import { chromium, test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

import { testEnv as env } from '../tests/test-env';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('opens slack.com with extension loaded', async () => {
	const pathToExtension = path.join(__dirname, '..', '.output', 'chrome-mv3');

	const context = await chromium.launchPersistentContext('', {
		headless: false,
		args: [
			`--disable-extensions-except=${pathToExtension}`,
			`--load-extension=${pathToExtension}`,
		],
	});

	const page = await context.newPage();
	await page.goto(`https://${env.TEST_SLACK_WORKSPACE_NAME}.slack.com/sign_in_with_password`);

	// Wait for the page to load
	await page.waitForLoadState('networkidle');

	// Fill in email
	await page.fill('input[type="email"]', env.TEST_SLACK_EMAIL);

	// Fill in password
	await page.fill('input[type="password"]', env.TEST_SLACK_PASSWORD);

	// Click submit button
	await page.click('button[type="submit"]');

	// Wait to observe the login
	await page.waitForTimeout(30000);

	await context.close();
});

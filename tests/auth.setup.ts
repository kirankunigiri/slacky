import { Page, test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

import { testEnv as env } from './test-env';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Fetches the latest email from testmail.app
 * Uses livequery to wait for new emails
 */
async function fetchMagicLinkEmail(timestampFrom: number): Promise<string> {
	const endpoint = `https://api.testmail.app/api/json?apikey=${env.TEST_MAIL_API_KEY}&namespace=${env.TEST_MAIL_NAMESPACE}&tag=${env.TEST_MAIL_TAG}&timestamp_from=${timestampFrom}&livequery=true`;
	console.log('Fetching email from testmail.app', endpoint);

	const response = await fetch(endpoint);
	const data = await response.json();

	if (data.result !== 'success' || data.count === 0) {
		throw new Error('Failed to fetch email from testmail.app');
	}

	// Get the most recent email
	const email = data.emails[0];

	// Extract the magic link from the email text
	// The link is in the format: OPEN SLACK [https://app.slack.com/...]
	const urlMatch = email.text.match(/https:\/\/app\.slack\.com\/[^\s\]]+/);

	if (!urlMatch) {
		throw new Error('Magic link not found in email');
	}

	return urlMatch[0];
}

/** Determines which authentication method to use */
function getAuthMethod(): 'password' | 'magic-link' {
	// If in CI, use magic link
	if (process.env.CI) return 'magic-link';

	// Check for cli env vars
	if (process.env.AUTH_METHOD === 'password') return 'password';
	if (process.env.AUTH_METHOD === 'magic-link') return 'magic-link';

	// Default to password for local dev testing
	return 'password';
}

/**
 * Magic link authentication via testmail.app
 */
async function magicLinkLogin(page: Page) {
	console.log('Using magic link authentication');

	if (!env.TEST_MAIL_API_KEY || !env.TEST_MAIL_NAMESPACE || !env.TEST_MAIL_TAG) {
		throw new Error('Testmail environment variables not set. Required: TEST_MAIL_API_KEY, TEST_MAIL_NAMESPACE, TEST_MAIL_TAG');
	}

	// Record timestamp before triggering email
	const timestampFrom = Date.now();

	// Navigate to magic link signin page
	await page.goto(`https://${env.TEST_SLACK_WORKSPACE_NAME}.slack.com/forgot/signin`);

	// Wait for the page to load
	await page.waitForLoadState('networkidle');

	// Enter email address in the magic link input
	await page.fill('[data-qa="magic_signin_email"]', env.TEST_SLACK_EMAIL);

	// Submit the form
	await page.click('[data-qa="magic_signin_submit"]');

	console.log('Waiting for magic link email...');

	// Fetch the magic link from testmail.app (this will wait until email arrives)
	const magicLink = await fetchMagicLinkEmail(timestampFrom);

	console.log('Magic link received, navigating...');

	// Navigate to the magic link
	const newPage = await page.context().newPage();
	await newPage.goto(magicLink, { waitUntil: 'commit' });

	// Wait for Slack to load after authentication
	await newPage.waitForSelector('text=Launching', { timeout: 30000 });

	// Save storage state
	await newPage.context().storageState({ path: authFile });

	console.log('Authentication successful!');
}

/**
 * Authentication setup for Playwright tests
 * Defaults to magic link auth in CI, password auth for development
 * Skip with: SKIP_AUTH=1 bun run test
 */
setup('authenticate', async ({ page }) => {
	if (process.env.SKIP_AUTH) {
		console.log('Skipping auth (SKIP_AUTH=1)');
		return;
	}

	const authMethod = getAuthMethod();
	console.log(`Authentication method: ${authMethod}`);

	if (authMethod === 'magic-link') {
		await magicLinkLogin(page);
	} else if (authMethod === 'password') {
		await passwordLogin(page);
	}
});

/**
 * Password based login
 * Only use when testing locally - CI only supports magic link login
 */
const passwordLogin = async (page: Page) => {
	if (!env.TEST_SLACK_PASSWORD) {
		throw new Error('TEST_SLACK_PASSWORD is not set');
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
};

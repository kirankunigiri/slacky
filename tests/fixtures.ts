/* eslint-disable no-empty-pattern */
import { type BrowserContext, type Page, test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { fileURLToPath } from 'url';

chromium.use(StealthPlugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pathToExtension = path.join(__dirname, '..', '.output', 'test-build');
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/** Sets up a monitor that fails the test when expected errors caused by Slack occur */
function setupUnfurlMonitor(page: Page) {
	page.addLocatorHandler(
		page.getByText('I didn\'t unfurl'),
		async () => {
			throw new Error('Error: Slack removed the embed because another embed for the same link already exists. This should not happen.');
		},
		{ noWaitAfter: true },
	);
	page.addLocatorHandler(
		page.getByText('Attachment removing failed!'),
		async () => {
			throw new Error('Error: Slack had an issue removing the attachment. This happens sometimes and the test should restart.');
		},
		{ noWaitAfter: true },
	);
}

export const test = base.extend<{
	context: BrowserContext
	extensionId: string
}>({
	context: async ({ }, use) => {
		const context = await chromium.launchPersistentContext('', {
			channel: 'chromium',
			args: [
				`--disable-extensions-except=${pathToExtension}`,
				`--load-extension=${pathToExtension}`,
			],
		});

		// Apply saved auth state
		const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
		await context.addCookies(storageState.cookies);

		// Set up unfurl monitor on all new pages
		context.on('page', (page) => {
			setupUnfurlMonitor(page);
		});

		// Set up on existing pages
		for (const page of context.pages()) {
			setupUnfurlMonitor(page);
		}

		await use(context);
		await context.close();
	},
	extensionId: async ({ context }, use) => {
		let [serviceWorker] = context.serviceWorkers();
		if (!serviceWorker)
			serviceWorker = await context.waitForEvent('serviceworker');

		const extensionId = serviceWorker.url().split('/')[2];
		await use(extensionId);
	},
});

export const expect = test.expect;

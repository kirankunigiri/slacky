/* eslint-disable no-empty-pattern */
/* eslint-disable react-hooks/rules-of-hooks */ // TODO: Fix in ESLint for non-jsx files
import { type BrowserContext, chromium, test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pathToExtension = path.join(__dirname, '..', '.output', 'chrome-mv3');
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

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

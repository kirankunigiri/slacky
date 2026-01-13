import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod/v4';

const isCi = Boolean(process.env.CI);

export const testEnv = createEnv({
	clientPrefix: 'TEST_',
	client: {
		// Slack workspace
		TEST_SLACK_WORKSPACE_NAME: z.string(),
		TEST_SLACK_EMAIL: z.email(),

		// Password login
		TEST_SLACK_PASSWORD: z.string().optional(),

		// Magic link login - Testmail.app (required in CI, optional locally)
		TEST_MAIL_API_KEY: isCi ? z.string() : z.string().optional(),
		TEST_MAIL_NAMESPACE: isCi ? z.string() : z.string().optional(),
		TEST_MAIL_TAG: isCi ? z.string() : z.string().optional(),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});

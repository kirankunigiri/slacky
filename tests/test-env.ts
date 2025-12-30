import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod/v4';

// TODO: Need a way to disable analytics in tests
export const testEnv = createEnv({
	clientPrefix: 'TEST_',
	client: {
		// Slack login
		TEST_SLACK_WORKSPACE_NAME: z.string(),
		TEST_SLACK_EMAIL: z.email(),
		TEST_SLACK_PASSWORD: z.string(),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod/v4';

/** Transform string 'true'/'false' to boolean, defaults to false */
const booleanEnv = z
	.string()
	.refine(s => s === 'true' || s === 'false')
	.transform(s => s === 'true')
	.optional()
	.default(false);

export const clientEnv = createEnv({
	clientPrefix: 'VITE_',
	client: {
		// PostHog analytics
		VITE_PUBLIC_POSTHOG_HOST: z.url().optional(),
		VITE_PUBLIC_POSTHOG_KEY: z.string().optional(),

		// Analytics debug options
		VITE_DEV_ENABLE_ANALYTICS: booleanEnv,
		VITE_DEV_ENABLE_ANALYTICS_LOGGING: booleanEnv,
		VITE_DEV_ANALYTICS_USERNAME: z.string().optional(),

		// Other
		VITE_REQUIRE_POSTHOG_IN_PROD: booleanEnv, // if true, creds will be validated in wxt.config.ts
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});

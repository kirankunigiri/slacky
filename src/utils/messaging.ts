import { defineExtensionMessaging } from '@webext-core/messaging';

import type { TrackEventArgs } from './analytics';

// This file must only contain type imports to avoid bundling background script code in content scripts

interface MessagingProtocol {
	trackEvent(data: TrackEventArgs): void
	sendSlackMessage(data: { text: string }): void
	submitSlackMessage(data: { text: string }): boolean
}

export const { sendMessage, onMessage } = defineExtensionMessaging<MessagingProtocol>();

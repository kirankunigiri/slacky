import { defineExtensionMessaging } from '@webext-core/messaging';

import type { TrackEventArgs } from '@/utils/analytics';
import type { SlackChannel } from '@/utils/store';

// This file must only contain type imports to avoid bundling background script code in content scripts

interface SlackMessageData {
	text: string
	channel: SlackChannel
}

interface MessagingProtocol {
	trackEvent(data: TrackEventArgs): void
	sendSlackMessage(data: SlackMessageData): void
	submitSlackMessage(data: SlackMessageData): boolean
}

export const { sendMessage, onMessage } = defineExtensionMessaging<MessagingProtocol>();

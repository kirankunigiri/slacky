import { sendMessage } from '@/utils/messaging';
import { featureUsageCounts$, loadStorage, settings$, SlackChannel } from '@/utils/store';

interface PR {
	github_url: string
	graphite_url: string
	title: string
	linesAdded: number
	linesRemoved: number
	repo: string // owner/repo
}

/**
 * Formats a PR message using a template string with {{variableName}} syntax
 */
const formatPRMessage = (pr: PR, template: string): string => {
	return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
		// Handle backward compatibility: map 'url' to 'github_url'
		const key = variableName === 'url' ? 'github_url' : variableName;

		// Access the property from the PR object
		const value = pr[key as keyof PR];
		return value !== undefined ? String(value) : match;
	});
};

/**
 * Constructs a Graphite URL from GitHub PR information
 * @param repo - Repository in format "owner/repo"
 * @param prNumber - PR number
 * @returns Graphite PR URL
 */
const constructGraphiteUrl = (repo: string, prNumber: number): string => {
	return `https://app.graphite.com/github/pr/${repo}/${prNumber}`;
};

/**
 * Constructs a GitHub URL from repository and PR number
 * @param repo - Repository in format "owner/repo"
 * @param prNumber - PR number
 * @returns GitHub PR URL
 */
const constructGithubUrl = (repo: string, prNumber: number): string => {
	return `https://github.com/${repo}/pull/${prNumber}`;
};

const getPRFromGitHub = async (): Promise<PR | null> => {
	// Get current URL
	const url = window.location.href;

	// Validate it's a GitHub PR URL (format: https://github.com/owner/repo/pull/number)
	const prUrlPattern = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/;
	const match = url.match(prUrlPattern);

	if (!match) {
		console.error('Not a valid GitHub PR URL');
		return null;
	}

	// Extract repo name (owner/repo) and PR number
	const repo = match[1];
	const prNumber = parseInt(match[2], 10);

	// Extract PR name using query selector
	const prTitleElement = document.querySelector('.js-issue-title');
	const title = prTitleElement?.textContent?.trim() || 'Unknown PR';

	// Extract lines added and removed
	const diffStatsElement = document.getElementById('diffstat');
	const diffText = diffStatsElement?.textContent?.trim() || '';

	// Use regex to find +X and −X patterns
	const addedMatch = diffText.match(/\+(\d+)/);
	const removedMatch = diffText.match(/−(\d+)/);

	const linesAdded = addedMatch ? parseInt(addedMatch[1], 10) : 0;
	const linesRemoved = removedMatch ? parseInt(removedMatch[1], 10) : 0;

	// Construct both URLs
	const github_url = constructGithubUrl(repo, prNumber);
	const graphite_url = constructGraphiteUrl(repo, prNumber);

	return {
		github_url,
		graphite_url,
		title,
		linesAdded,
		linesRemoved,
		repo,
	};
};

const getPRFromGraphite = async (): Promise<PR | null> => {
	// Get current URL
	const url = window.location.href;

	// Validate it's a Graphite PR URL (format: https://app.graphite.com/github/pr/owner/repo/number/...)
	const prUrlPattern = /^https:\/\/app\.graphite\.com\/github\/pr\/([^/]+\/[^/]+)\/(\d+)/;
	const match = url.match(prUrlPattern);

	if (!match) {
		console.error('Not a valid Graphite PR URL');
		return null;
	}

	// Extract repo name (owner/repo) and PR number
	const repo = match[1];
	const prNumber = parseInt(match[2], 10);

	const titleElement = document.querySelector('[class*="TextareaWithInlineEdit_editButton"]');
	if (!titleElement) return null;

	// Lines added
	const linesAddedElement = document.querySelector('[class*="FileChangeStats_linesAdded"]');
	if (!linesAddedElement) return null;
	const linesAddedText = linesAddedElement.textContent?.trim() || '0';
	const linesAdded = parseInt(linesAddedText.replace(/\D/g, ''), 10);

	// Lines removed
	const linesRemovedElement = document.querySelector('[class*="FileChangeStats_linesRemoved"]');
	if (!linesRemovedElement) return null;
	const linesRemovedText = linesRemovedElement.textContent?.trim() || '0';
	const linesRemoved = parseInt(linesRemovedText.replace(/\D/g, ''), 10);

	// Construct both URLs
	const github_url = constructGithubUrl(repo, prNumber);
	const graphite_url = constructGraphiteUrl(repo, prNumber);

	return {
		github_url,
		graphite_url,
		title: titleElement.textContent?.trim(),
		linesAdded,
		linesRemoved,
		repo,
	};
};

export const getPRMessage = async ({ platform }: { platform: 'github' | 'graphite' }) => {
	const pr = platform === 'github' ? await getPRFromGitHub() : await getPRFromGraphite();
	if (!pr) return;

	await loadStorage();
	const template = settings$.pr_message_template.get();
	return formatPRMessage(pr, template);
};

/**
 * Gets both plain text and HTML versions of the PR message
 * @param platform - The platform where the PR is located
 * @returns Object with text and html versions, or undefined if PR not found
 */
export const getPRMessageWithHTML = async ({ platform }: { platform: 'github' | 'graphite' }) => {
	const message = await getPRMessage({ platform });
	if (!message) return;

	const html = markdownToHtml(message);
	return { text: message, html };
};

/**
 * Handles sending a PR message to a Slack channel with tracking
 * @param platform - The platform where the action was initiated
 * @param channel - The Slack channel to send to
 * @returns true if successful, false if message couldn't be generated
 */
export const sendPRMessageToSlack = async ({
	platform,
	channel,
}: {
	platform: 'github' | 'graphite'
	channel: SlackChannel
}): Promise<boolean> => {
	const messageData = await getPRMessageWithHTML({ platform });
	if (!messageData) return false;

	// Track feature usage
	const autoSubmitted = settings$.auto_submit_pr_message.get();
	featureUsageCounts$.pr_message.set(v => v + 1);
	sendMessage('trackEvent', {
		eventName: 'pr_message_sent_to_slack',
		eventProperties: {
			location: platform,
			auto_submitted: autoSubmitted,
		},
	});

	await sendMessage('sendSlackMessage', {
		channel: channel,
		text: messageData.text,
		html: messageData.html,
	});

	return true;
};

/**
 * Converts markdown links to HTML
 * @param text - Text containing markdown links like [text](url)
 * @returns HTML string with <a> tags
 */
const markdownToHtml = (text: string): string => {
	// Convert markdown links [text](url) to HTML <a href="url">text</a>
	return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
};

/**
 * Handles copying a PR message to clipboard with tracking
 * @param platform - The platform where the action was initiated
 * @returns true if successful, false if message couldn't be generated
 */
export const copyPRMessageToClipboard = async ({
	platform,
}: {
	platform: 'github' | 'graphite'
}): Promise<boolean> => {
	const message = await getPRMessage({ platform });
	if (!message) return false;

	// Track feature usage
	featureUsageCounts$.pr_message.set(v => v + 1);
	sendMessage('trackEvent', {
		eventName: 'pr_message_copied',
		eventProperties: {
			location: platform,
		},
	});

	// Convert markdown to HTML for rich text support in Slack
	const htmlMessage = markdownToHtml(message);

	// Write both plain text and HTML to clipboard
	// This allows apps like Slack to use the formatted version
	const clipboardItem = new ClipboardItem({
		'text/plain': new Blob([message], { type: 'text/plain' }),
		'text/html': new Blob([htmlMessage], { type: 'text/html' }),
	});

	await navigator.clipboard.write([clipboardItem]);

	return true;
};

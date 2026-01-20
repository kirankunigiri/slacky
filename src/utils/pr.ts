import { loadStorage, settings$ } from '@/utils/store';

interface PR {
	url: string
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
		// Access the property from the PR object
		const value = pr[variableName as keyof PR];
		return value !== undefined ? String(value) : match;
	});
};

const getPRFromGitHub = async (): Promise<PR | null> => {
	// Get current URL
	const url = window.location.href;

	// Validate it's a GitHub PR URL (format: https://github.com/owner/repo/pull/number)
	const prUrlPattern = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/\d+/;
	const match = url.match(prUrlPattern);

	if (!match) {
		console.error('Not a valid GitHub PR URL');
		return null;
	}

	// Extract repo name (owner/repo)
	const repo = match[1];

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

	return {
		url,
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
	const prUrlPattern = /^https:\/\/app\.graphite\.com\/github\/pr\/([^/]+\/[^/]+)\/\d+/;
	const match = url.match(prUrlPattern);

	if (!match) {
		console.error('Not a valid Graphite PR URL');
		return null;
	}

	// Extract repo name (owner/repo)
	const repo = match[1];

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

	return {
		url,
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

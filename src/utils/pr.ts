interface PR {
	url: string
	title: string
	linesAdded: number
	linesRemoved: number
	repo: string // owner/repo
}

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

export const copyPRMessageGitHub = async () => {
	const pr = await getPRFromGitHub();
	if (!pr) return;

	// Format message: "URL - PRNAME"
	const message = `${pr.url} - ${pr.title} (+${pr.linesAdded} / -${pr.linesRemoved})`;

	// Copy to clipboard
	await navigator.clipboard.writeText(message);
};

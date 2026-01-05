(function () {
	var scheme = localStorage.getItem('mantine-color-scheme') || 'dark';
	document.documentElement.setAttribute('data-mantine-color-scheme', scheme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : scheme);
})();

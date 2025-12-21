import '@/assets/tailwind.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { ThemeProvider } from '@/components/ui/theme-provider.tsx';
import App from '@/entrypoints/popup/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<App />
		</ThemeProvider>
	</React.StrictMode>,
);

import '@/assets/index.css';
import '@/assets/tailwind.css';
import '@/theme/style.css';

import { MantineProvider } from '@mantine/core';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { shadcnCssVariableResolver } from '@/theme/cssVariablerResolver.ts';
import { shadcnTheme } from '@/theme/theme.tsx';

import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<MantineProvider
			theme={shadcnTheme}
			cssVariablesResolver={shadcnCssVariableResolver}
		>
			<App />
		</MantineProvider>
	</React.StrictMode>,
);

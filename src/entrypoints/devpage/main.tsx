import '@/assets/tailwind.css';
import '@/theme/style.css';

import { MantineProvider } from '@mantine/core';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from '@/entrypoints/popup/App';
import { shadcnCssVariableResolver } from '@/theme/cssVariablerResolver';
import { shadcnTheme } from '@/theme/theme';

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

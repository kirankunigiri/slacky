import ReactDOM from 'react-dom/client';

import App from '@/components/app';
import { BaseApp } from '@/components/base-app';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<BaseApp>
		<App />
	</BaseApp>,
);

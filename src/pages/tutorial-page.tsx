import ReactDOM from 'react-dom/client';

import { BaseApp } from '@/pages/base-app';

function TutorialPageContent() {
	return (
		<div className="overflow-hidden">
			<p>Tutorial Page</p>
		</div>
	);
}
const TutorialPage = withSettingsLoaded(TutorialPageContent);

ReactDOM.createRoot(document.getElementById('root')!).render(
	<BaseApp>
		<TutorialPage />
	</BaseApp>,
);

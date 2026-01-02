import ReactDOM from 'react-dom/client';

import { BaseApp } from '@/components/base-app';

function TutorialPageContent() {
	return (
		<div className="h-[500px] max-h-[500px] overflow-hidden">
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

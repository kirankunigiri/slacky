import { ActionIcon, Badge, Button, Checkbox, Divider, Group, ScrollArea, Select, SelectProps, Space, Text, TextInput, Tooltip } from '@mantine/core';
import ReactDOM from 'react-dom/client';

import Header from '@/components/header';
import { BaseApp } from '@/pages/base-app';

function TutorialPageContent() {
	return (
		<div className="w-[700px] p-4">
			<Header isTutorialPage />
			<Text size="sm" color="dimmed">Slacky is a browser extension that improves your Slack experience in the browser. This tutorial will walk you through the features and how to use them.</Text>
		</div>
	);
}
const TutorialPage = withSettingsLoaded(TutorialPageContent);

ReactDOM.createRoot(document.getElementById('root')!).render(
	<BaseApp>
		<TutorialPage />
	</BaseApp>,
);

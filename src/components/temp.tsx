import { Group, Radio, Space, Stack, Text } from '@mantine/core';
import { useState } from 'react';

const exportOptions = [
	{
		value: 'disabled',
		label: 'Disabled',
		description: 'Export button will be hidden from messages.',
	},
	{
		value: 'clipboard',
		label: 'Clipboard',
		description: 'Copy message content to clipboard as markdown.',
	},
	{
		value: 'markdown',
		label: 'Markdown File',
		description: 'Download message as a .md file.',
	},
];

function ExportMessageSettings() {
	const [value, setValue] = useState<string>('clipboard');

	return (
		<div className="flex flex-col gap-1">
			<p className="text-base font-medium">Export Messages</p>
			<p className="text-xs opacity-60">Choose how to export messages from Slack conversations.</p>
			<Space h="xs" />

			<Radio.Group value={value} onChange={setValue}>
				<Stack gap="xs">
					{exportOptions.map(option => (
						<Radio.Card
							key={option.value}
							value={option.value}
						>
							<Group wrap="nowrap" align="flex-start" p="sm">
								<Radio.Indicator />
								<div>
									<Text size="sm" fw={500}>{option.label}</Text>
									<Text size="xs" c="dimmed">{option.description}</Text>
								</div>
							</Group>
						</Radio.Card>
					))}
				</Stack>
			</Radio.Group>
			<Space h="sm" />
		</div>
	);
}

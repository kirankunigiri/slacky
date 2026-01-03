import { useValue } from '@legendapp/state/react';
import { Group, Select, SelectProps } from '@mantine/core';
import { IconCheck, IconCircleOff, IconClipboard, IconMarkdown } from '@tabler/icons-react';

import { settings$ } from '@/utils/store';

const icons: Record<string, React.ReactNode> = {
	clipboard: <IconClipboard size={16} />,
	markdown_file: <IconMarkdown size={16} />,
	disabled: <IconCircleOff size={16} />,
};

const renderSelectOption: SelectProps['renderOption'] = ({ option, checked }) => (
	<Group flex="1" gap="xs">
		{icons[option.value]}
		{option.label}
		{checked && <IconCheck size={16} style={{ marginInlineStart: 'auto' }} />}
	</Group>
);

function MessageExportSettings() {
	const messageExportFormat = useValue(settings$.messageExportFormat);

	return (
		<Select
			size="sm"
			data={[{
				value: 'clipboard',
				label: 'Clipboard',
			}, {
				value: 'markdown_file',
				label: 'Markdown File',
			}, {
				value: 'disabled',
				label: 'Disabled',
			}]}
			renderOption={renderSelectOption}
			value={messageExportFormat}
			onChange={value => settings$.messageExportFormat.set(value as MessageExportFormat)}
		/>
	);
}

export default MessageExportSettings;

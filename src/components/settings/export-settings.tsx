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

const exportFormatSelectOptions: {
	value: MessageExportFormat
	label: string
}[] = [{
	value: 'clipboard',
	label: 'Clipboard',
}, {
	value: 'markdown_file',
	label: 'Markdown File',
}, {
	value: 'disabled',
	label: 'Disabled',
}];

function MessageExportSettings() {
	const messageExportFormat = useValue(settings$.message_export_format);

	return (
		<Select
			size="sm"
			data={exportFormatSelectOptions}
			renderOption={renderSelectOption}
			leftSection={messageExportFormat ? icons[messageExportFormat] : null}
			value={messageExportFormat}
			onChange={value => settings$.message_export_format.set(value as MessageExportFormat)}
		/>
	);
}

export default MessageExportSettings;

import { Inspector } from 'react-dev-inspector';

const template = `cursor://file/{{absolutePath}}:{{lineNumber}}:{{columnNumber}}`;

// defined in wxt.config.ts
const projectRoot = import.meta.env.VITE_PROJECT_ROOT;

function DevInspector() {
	return (
		<Inspector
			onInspectElement={async (param) => {
				const codeInfo = param.codeInfo;
				if (!codeInfo) {
					console.error('No codeInfo found in param', param);
					return;
				}

				const relativePath = codeInfo.relativePath;
				if (!relativePath) {
					console.error('No relativePath found in codeInfo', codeInfo);
					return;
				}

				const absolutePath = `${projectRoot}/${relativePath}`.replace('//', '/');
				const lineNumber = codeInfo.lineNumber || 1;
				const columnNumber = codeInfo.columnNumber || 1;

				const url = template
					.replace('{{absolutePath}}', absolutePath)
					.replace('{{lineNumber}}', lineNumber.toString())
					.replace('{{columnNumber}}', columnNumber.toString());
				window.open(url, '_blank');
			}}
			keys={['Alt', 'i']}
		/>
	);
}

export default DevInspector;

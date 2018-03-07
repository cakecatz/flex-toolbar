/** @babel */

export default function (toolBar, button) {
	const options = {
		icon: button.icon,
		iconset: button.iconset,
		tooltip: button.tooltip,
		priority: button.priority || 45,
		data: button.file,
		callback: (file) => {
			atom.workspace.open(file);
		}
	};

	return toolBar.addButton(options);
}

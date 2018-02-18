/** @babel */

export default function (toolBar, button) {
	const options = {
		icon: button.icon,
		iconset: button.iconset,
		tooltip: button.tooltip,
		priority: button.priority || 45,
		callback: button.callback,
	};

	return toolBar.addButton(options);
}

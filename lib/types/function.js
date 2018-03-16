/** @babel */

export default function (toolBar, button, getActiveItem) {
	const options = {
		icon: button.icon,
		iconset: button.iconset,
		text: button.text,
		html: button.html,
		tooltip: button.tooltip,
		priority: button.priority || 45,
		data: button.callback,
		callback(data) {
			return data.call(this, getActiveItem().item);
		},
	};

	return toolBar.addButton(options);
}

/** @babel */

export default function (toolBar, button) {
	const options = {
		icon: button.icon,
		iconset: button.iconset,
		text: button.text,
		html: button.html,
		tooltip: button.tooltip,
		priority: button.priority || 45,
		data: button.callback,
		callback(data, target) {
			return data.call(this, target);
		},
	};

	return toolBar.addButton(options);
}

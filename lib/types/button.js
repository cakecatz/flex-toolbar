/** @babel */

export default function (toolBar, button) {
	const options = {
		icon: button.icon,
		iconset: button.iconset,
		text: button.text,
		html: button.html,
		tooltip: button.tooltip,
		priority: button.priority || 45,
		background: button.background,
		color: button.color,
		class: button.class,
		callback: button.callback,
	};

	return toolBar.addButton(options);
}

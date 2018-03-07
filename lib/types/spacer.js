/** @babel */

export default function (toolBar, button) {
	const options = {
		priority: button.priority || 45,
	};
	return toolBar.addSpacer(options);
}

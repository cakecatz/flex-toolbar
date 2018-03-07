/** @babel */

import { shell } from 'electron';
import UrlReplace from '../url-replace';

export default function (toolBar, button) {
	var options = {
		icon: button.icon,
		iconset: button.iconset,
		text: button.text,
		html: button.html,
		tooltip: button.tooltip,
		priority: button.priority || 45,
		data: button.url,
		callback(url) {
			const urlReplace = new UrlReplace();
			// eslint-disable-next-line no-param-reassign
			url = urlReplace.replace(url);
			if (url.startsWith('atom://')) {
				return atom.workspace.open(url);
			} else if (atom.config.get('flex-tool-bar.useBrowserPlusWhenItIsActive')) {
				if (atom.packages.isPackageActive('browser-plus')) {
					return atom.workspace.open(url, {split: 'right'});
				}
				const warning = 'Package browser-plus is not active. Using default browser instead!';
				options = {detail: 'Use apm install browser-plus to install the needed package.'};
				atom.notifications.addWarning(warning, options);
				return shell.openExternal(url);

			}
			return shell.openExternal(url);
		},
	};

	return toolBar.addButton(options);
}

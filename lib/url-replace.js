/** @babel */

export default class UrlReplace {
	constructor() {
		const repo = this.getRepositoryForActiveItem();
		this.repoInfo = this.parseUrl(repo ? repo.getOriginURL() : null);
		this.info = {
			'repo-name': this.repoInfo.name,
			'repo-owner': this.repoInfo.owner,
			'atom-version': atom.getVersion()
		};
	}

	replace(url) {
		const re = /({[^}]*})/;

		let m = re.exec(url);
		while (m) {
			const [matchedText] = m;
			// eslint-disable-next-line no-param-reassign
			url = url.replace(m[0], this.getInfo(matchedText));

			m = re.exec(url);
		}

		return url;
	}

	getInfo(key) {
	// eslint-disable-next-line no-param-reassign
		key = key.replace(/{([^}]*)}/, '$1');
		if (key in this.info) {
			return this.info[key];
		}

		return key;
	}

	getRepositoryDetail() {
		return atom.project.getRepositories();
	}

	getActiveItemPath() {
		const item = this.getActiveItem();
		return item ? item.getPath : null;
	}

	getRepositoryForActiveItem() {
		const [rootDir] = atom.project.relativizePath(this.getActiveItemPath());
		const rootDirIndex = atom.project.getPaths().indexOf(rootDir);
		if (rootDirIndex >= 0) {
			return this.getRepositoryDetail()[rootDirIndex];
		}
		for (const repo of this.getRepositoryDetail()) {
			if (repo) {
				return repo;
			}
		}
	}

	getActiveItem() {
		return atom.workspace.getActivePaneItem();
	}

	parseUrl(url) {
		const repoInfo = {
			owner: '',
			name: ''
		};

		if (!url) {
			return repoInfo;
		}

		let re;
		if (url.indexOf('http' >= 0)) {
			re = /github\.com\/([^/]*)\/([^/]*)\.git/;
		}
		if (url.indexOf('git@') >= 0) {
			re = /:([^/]*)\/([^/]*)\.git/;
		}
		const m = re.exec(url);

		if (m) {
			return {owner: m[1], name: m[2]};
		}

		return repoInfo;
	}
}

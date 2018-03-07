/** @babel */

import path from 'path';
import util from 'util';
import fs from 'fs-plus';
import chokidar from 'chokidar';
import globToRegexp from 'glob-to-regexp';
import { CompositeDisposable } from 'atom';
import changeCase from 'change-case';

const VALID_EXTENSIONS = [
	'.cson',
	'.coffee',
	'.json5',
	'.json',
	'.js'
];

export default {
	toolBar: null,
	configFilePath: null,
	currentGrammar: null,
	currentProject: null,
	buttonTypes: [],
	configWatcher: null,
	projectConfigwatcher: null,
	functionConditions: [],
	functionPoll: null,
	conditionTypes: {},

	config: {
		persistentProjectToolBar: {
			description: 'Project tool bar will stay when focus is moved away from a project file',
			type: 'boolean',
			default: false,
		},
		pollFunctionConditionsToReloadWhenChanged: {
			type: 'integer',
			description: 'set to 0 to stop polling',
			default: 300,
			minimum: 0,
		},
		reloadToolBarNotification: {
			type: 'boolean',
			default: true,
		},
		reloadToolBarWhenEditConfigFile: {
			type: 'boolean',
			default: true,
		},
		toolBarConfigurationFilePath: {
			type: 'string',
			default: atom.getConfigDirPath(),
		},
		toolBarProjectConfigurationFilePath: {
			type: 'string',
			default: '.',
		},
		useBrowserPlusWhenItIsActive: {
			type: 'boolean',
			default: false,
		},
	},

	activate() {
		this.subscriptions = new CompositeDisposable();
		this.changeGrammarSubscription = new CompositeDisposable();

		require('atom-package-deps').install('flex-tool-bar');

		this.storeProject();
		this.storeGrammar();
		this.registerTypes();
		this.registerCommands();
		this.registerEvents();
		this.observeConfig();

		this.resolveConfigPath();
		this.registerWatch();

		this.resolveProjectConfigPath();
		this.registerProjectWatch();

		return this.reloadToolbar();
	},

	pollFunctions() {
		if (!this.conditionTypes.function) {
			return;
		}
		const pollTimeout = atom.config.get('flex-tool-bar.pollFunctionConditionsToReloadWhenChanged');
		if (this.functionConditions.length === 0 && pollTimeout === 0) {
			return;
		}

		return this.functionPoll = setTimeout(() => {
			let reload = false;
			const editor = atom.workspace.getActivePaneItem();

			for (const condition of this.functionConditions) {
				try {
					if (condition.value !== !!condition.func(editor)) {
						reload = true;
						break;
					}
				} catch (err) {
					const buttons = [{
						text: 'Edit Config',
						onDidClick: () => atom.workspace.open(this.configFilePath)
					}];
					if (this.projectConfigFilePath) {
						buttons.push([{
							text: 'Edit Project Config',
							onDidClick: () => atom.workspace.open(this.projectConfigFilePath)
						}]);
					}
					atom.notifications.addError('Invalid toolbar config', {
						detail: err.stack ? err.stack : err.toString(),
						dismissable: true,
						buttons,
					});
					return;
				}
			}

			if (reload) {
				return this.reloadToolbar();
			}

			return this.pollFunctions();
		}, pollTimeout);
	},

	observeConfig() {
		this.subscriptions.add(atom.config.onDidChange('flex-tool-bar.persistentProjectToolBar', ({newValue}) => {
			this.unregisterProjectWatch();
			if (this.resolveProjectConfigPath(null, newValue)) {
				this.registerProjectWatch();
			}
			return this.reloadToolbar();
		}));

		this.subscriptions.add(atom.config.onDidChange('flex-tool-bar.pollFunctionConditionsToReloadWhenChanged', ({newValue}) => {
			clearTimeout(this.functionPoll);
			if (newValue !== 0) {
				return this.pollFunctions();
			}
		}));

		this.subscriptions.add(atom.config.onDidChange('flex-tool-bar.reloadToolBarWhenEditConfigFile', ({newValue}) => {
			this.unregisterWatch();
			this.unregisterProjectWatch();
			if (newValue) {
				this.registerWatch(true);
				return this.registerProjectWatch(true);
			}
		}));

		this.subscriptions.add(atom.config.onDidChange('flex-tool-bar.toolBarConfigurationFilePath', ({newValue}) => {
			this.unregisterWatch();
			if (this.resolveConfigPath(newValue, false)) {
				this.registerWatch();
			}
			return this.reloadToolbar();
		}));

		return this.subscriptions.add(atom.config.onDidChange('flex-tool-bar.toolBarProjectConfigurationFilePath', ({newValue}) => {
			this.unregisterProjectWatch();
			if (this.resolveProjectConfigPath(newValue)) {
				this.registerProjectWatch();
			}
			return this.reloadToolbar();
		}));
	},

	resolveConfigPath(configFilePath, createIfNotFound) {
		if (configFilePath == null) {
			configFilePath = atom.config.get('flex-tool-bar.toolBarConfigurationFilePath');
		}
		if (createIfNotFound == null) {
			createIfNotFound = true;
		}
		let configPath = configFilePath;
		if (!fs.isFileSync(configPath)) {
			configPath = fs.resolve(configPath, 'toolbar', VALID_EXTENSIONS);
		}

		if (configPath) {
			this.configFilePath = configPath;
			return true;
		} else if (createIfNotFound) {
			configPath = configFilePath;
			const exists = fs.existsSync(configPath);
			if ((exists && fs.isDirectorySync(configPath)) || (!exists && !VALID_EXTENSIONS.includes(path.extname(configPath)))) {
				configPath = path.resolve(configPath, 'toolbar.cson');
			}
			if (this.createConfig(configPath)) {
				this.configFilePath = configPath;
				return true;
			}
		}

		return false;
	},

	createConfig(configPath) {
		try {
			const ext = path.extname(configPath);
			if (!VALID_EXTENSIONS.includes(ext)) {
				throw new Error(`'${ext}' is not a valid extension. Please us one of ['${VALID_EXTENSIONS.join('\',\'')}']`);
			}
			const content = fs.readFileSync(path.resolve(__dirname, `./defaults/toolbar${ext}`));
			fs.writeFileSync(configPath, content);
			atom.notifications.addInfo('We created a Tool Bar config file for you...', {
				detail: configPath,
				dismissable: true,
				buttons: [{
					text: 'Edit Config',
					onDidClick() {
						return atom.workspace.open(configPath);
					}
				}]
			});
			return true;
		} catch (err) {
			var notification = atom.notifications.addError('Something went wrong creating the Tool Bar config file!', {
				detail: `${configPath}\n\n${err.stack ? err.stack : err.toString()}`,
				dismissable: true,
				buttons: [{
					text: 'Reload Toolbar',
					onDidClick: () => {
						notification.dismiss();
						this.resolveConfigPath();
						this.registerWatch();
						return this.reloadToolbar();
					}
				}]
			});
			// eslint-disable-next-line no-console
			console.error(err);
			return false;
		}
	},

	resolveProjectConfigPath(configFilePath, persistent) {
		if (configFilePath == null) {
			configFilePath = atom.config.get('flex-tool-bar.toolBarProjectConfigurationFilePath');
		}
		if (persistent == null) {
			persistent = atom.config.get('flex-tool-bar.persistentProjectToolBar');
		}
		if (!persistent || !fs.isFileSync(this.projectConfigFilePath)) {
			this.projectConfigFilePath = null;
		}
		const editor = atom.workspace.getActivePaneItem();
		const file = (editor && editor.buffer && editor.buffer.file) || (editor && editor.file);
		const parent = file && file.getParent();


		if (parent && parent.path) {
			for (let pathToCheck of atom.project.getPaths()) {
				if (parent.path.includes(pathToCheck)) {
					pathToCheck = path.join(pathToCheck, configFilePath);
					if (fs.isFileSync(pathToCheck)) {
						this.projectConfigFilePath = pathToCheck;
					} else {
						const found = fs.resolve(pathToCheck, 'toolbar', VALID_EXTENSIONS);
						if (found) {
							this.projectConfigFilePath = found;
						}
					}
				}
			}
		}

		if (this.projectConfigFilePath === this.configFilePath) {
			this.projectConfigFilePath = null;
		}

		return !!this.projectConfigFilePath;
	},

	registerCommands() {
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'flex-tool-bar:edit-config-file': () => {
				if (this.configFilePath) {
					return atom.workspace.open(this.configFilePath);
				}
			}
		}));

		return this.subscriptions.add(atom.commands.add('atom-workspace', {
			'flex-tool-bar:edit-project-config-file': () => {
				if (this.projectConfigFilePath) {
					return atom.workspace.open(this.projectConfigFilePath);
				}
			}
		}));
	},

	registerEvents() {
		this.subscriptions.add(atom.packages.onDidActivateInitialPackages(() => {
			if (this.conditionTypes.package) {
				this.reloadToolbar();
			}

			this.subscriptions.add(atom.packages.onDidActivatePackage(() => {
				if (this.conditionTypes.package) {
					return this.reloadToolbar();
				}
			}));

			return this.subscriptions.add(atom.packages.onDidDeactivatePackage(() => {
				if (this.conditionTypes.package) {
					return this.reloadToolbar();
				}
			})
			);
		}));

		this.subscriptions.add(atom.config.onDidChange(() => {
			if (this.conditionTypes.setting) {
				return this.reloadToolbar();
			}
		}));

		return this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem((item) => {
			this.changeGrammarSubscription.dispose();
			this.changeGrammarSubscription.clear();
			if (item && item.onDidChangeGrammar) {
				this.changeGrammarSubscription.add(item.onDidChangeGrammar(() => {
					if (this.storeGrammar()) {
						this.reloadToolbar();
					}
				}));
			}

			if (this.storeProject()) {
				this.storeGrammar();
				this.unregisterProjectWatch();
				this.resolveProjectConfigPath();
				this.registerProjectWatch();
				this.reloadToolbar();
			} else if (this.storeGrammar()) {
				this.reloadToolbar();
			}
		}));

		// TODO: recheck pattern if name changes?
	},

	unregisterWatch() {
		if (this.configWatcher) {
			this.configWatcher.close();
		}
		return this.configWatcher = null;
	},

	registerWatch(shouldWatch) {
		if (shouldWatch == null) {
			shouldWatch = atom.config.get('flex-tool-bar.reloadToolBarWhenEditConfigFile');
		}
		if (!shouldWatch || !this.configFilePath) {
			return;
		}

		if (this.configWatcher) {
			this.configWatcher.close();
		}
		return this.configWatcher = chokidar.watch(this.configFilePath)
			.on('change', () => {
				return this.reloadToolbar(atom.config.get('flex-tool-bar.reloadToolBarNotification'));
			});
	},

	unregisterProjectWatch() {
		if (this.projectConfigWatcher) {
			this.projectConfigWatcher.close();
		}
		return this.projectConfigWatcher = null;
	},

	registerProjectWatch(shouldWatch) {
		if (shouldWatch == null) {
			shouldWatch = atom.config.get('flex-tool-bar.reloadToolBarWhenEditConfigFile');
		}
		if (!shouldWatch || !this.projectConfigFilePath) {
			return;
		}

		if (this.projectConfigWatcher) {
			this.projectConfigWatcher.close();
		}
		return this.projectConfigWatcher = chokidar.watch(this.projectConfigFilePath)
			.on('change', () => {
				return this.reloadToolbar(atom.config.get('flex-tool-bar.reloadToolBarNotification'));
			});
	},

	registerTypes() {
		const typeFiles = fs.listSync(path.join(__dirname, './types'));
		return typeFiles.forEach(typeFile => {
			const typeName = path.basename(typeFile, '.js');
			return this.buttonTypes[typeName] = require(typeFile);
		});
	},

	consumeToolBar(toolBar) {
		this.toolBar = toolBar('flex-toolBar');
		return this.reloadToolbar();
	},

	getToolbarView() {
		// This is an undocumented API that moved in tool-bar@1.1.0
		return this.toolBar.toolBarView || this.toolBar.toolBar;
	},

	reloadToolbar(withNotification) {
		this.conditionTypes = {};
		clearTimeout(this.functionPoll);
		if (!this.toolBar) {
			return;
		}
		try {
			this.fixToolBarHeight();
			const toolBarButtons = this.loadConfig();
			this.removeButtons();
			this.addButtons(toolBarButtons);
			if (withNotification) {
				atom.notifications.addSuccess('The tool-bar was successfully updated.');
			}
			return this.unfixToolBarHeight();
		} catch (error) {
			this.unfixToolBarHeight();
			atom.notifications.addError(`Could not load your toolbar from \`${fs.tildify(this.configFilePath)}\``, {dismissable: true});
			throw error;
		}
	},

	fixToolBarHeight() {
		const toolBarView = this.getToolbarView();
		if (!toolBarView || !toolBarView.element) {
			return;
		}
		toolBarView.element.style.height = `${this.getToolbarView().element.offsetHeight}px`;
	},

	unfixToolBarHeight() {
		const toolBarView = this.getToolbarView();
		if (!toolBarView || !toolBarView.element) {
			return;
		}
		toolBarView.element.style.height = '';
	},

	addButtons(toolBarButtons) {
		const buttons = [];

		if (!toolBarButtons) {
			return buttons;
		}

		const devMode = atom.inDevMode();
		this.functionConditions = [];
		const btnErrors = [];

		for (const btn of toolBarButtons) {

			var button, disable, hide;
			try {
				hide = (btn.hide && this.checkConditions(btn.hide)) || (btn.show && !this.checkConditions(btn.show));
				disable = (btn.disable && this.checkConditions(btn.disable)) || (btn.enable && !this.checkConditions(btn.enable));
			} catch (err) {
				btnErrors.push(`${err.message || err.toString()}\n${util.inspect(btn, {depth: 4})}`);
				continue;
			}

			if (hide) {
				continue;
			}
			if (btn.mode && btn.mode === 'dev' && !devMode) {
				continue;
			}

			if (this.buttonTypes[btn.type]) {
				button = this.buttonTypes[btn.type](this.toolBar, btn);
			}

			if (btn.mode) {
				button.element.classList.add(`tool-bar-mode-${btn.mode}`);
			}

			if (btn.style) {
				for (const propName in btn.style) {
					const style = btn.style[propName];
					button.element.style[changeCase.camelCase(propName)] = style;
				}
			}

			if (btn.className) {
				const ary = btn.className.split(',');
				for (const val of ary) {
					button.element.classList.add(val.trim());
				}
			}

			if (disable) {
				button.setEnabled(false);
			}

			buttons.push(button);
		}

		if (btnErrors.length > 0) {
			const notificationButtons = [{
				text: 'Edit Config',
				onDidClick: () => atom.workspace.open(this.configFilePath)
			}];
			if (this.projectConfigFilePath) {
				notificationButtons.push([{
					text: 'Edit Project Config',
					onDidClick: () => atom.workspace.open(this.projectConfigFilePath)
				}]);
			}
			atom.notifications.addError('Invalid toolbar config', {
				detail: btnErrors.join('\n\n'),
				dismissable: true,
				buttons: notificationButtons,
			});
		}

		this.pollFunctions();

		return buttons;
	},

	removeCache(filePath) {
		delete require.cache[filePath];

		if (snapshotResult) {
			let relativeFilePath = path.relative(path.join(process.cwd(), 'resources', 'app', 'static'), filePath);
			if (process.platform === 'win32') {
				relativeFilePath = relativeFilePath.replace(/\\/g, '/');
			}
			delete snapshotResult.customRequire.cache[relativeFilePath];
		}
	},

	loadConfig() {
		let CSON, ext;
		let config = [{
			type: 'function',
			icon: 'tools',
			callback() {
				this.resolveConfigPath();
				this.registerWatch();
				return this.reloadToolbar();
			},
			tooltip: 'Create Global Tool Bar Config',
		}];

		if (this.configFilePath) {
			ext = path.extname(this.configFilePath);
			this.removeCache(this.configFilePath);

			switch (ext) {
				case '.js':
				case '.json':
				case '.coffee':
					config = require(this.configFilePath);
					break;

				case '.json5':
					require('json5/lib/require');
					config = require(this.configFilePath);
					break;

				case '.cson':
					CSON = require('cson');
					config = CSON.requireCSONFile(this.configFilePath);
					break;

				default:
					// do nothing
			}
		}

		if (this.projectConfigFilePath) {
			let projConfig;
			ext = path.extname(this.projectConfigFilePath);
			this.removeCache(this.projectConfigFilePath);

			switch (ext) {
				case '.js':
				case '.json':
				case '.coffee':
					projConfig = require(this.projectConfigFilePath);
					break;

				case '.json5':
					require('json5/lib/require');
					projConfig = require(this.projectConfigFilePath);
					break;

				case '.cson':
					CSON = require('cson');
					projConfig = CSON.requireCSONFile(this.projectConfigFilePath);
					break;

				default:
					// do nothing
			}

			config = config.concat(projConfig);
		}

		return config;
	},

	loopThrough(items, func) {
		if (!Array.isArray(items)) {
			items = [items];
		}
		let ret = false;
		for (const item of items) {
			ret = func(item) || ret;
		}

		return !!ret;
	},

	checkConditions(conditions) {
		return this.loopThrough(conditions, condition => {
			let ret = condition === true;

			if (typeof condition === 'string') {
				if (/^[^/]+\.(.*?)$/.test(condition)) {
					ret = this.patternCondition(condition) || ret;
				} else {
					ret = this.grammarCondition(condition) || ret;
				}
			} else if (typeof condition === 'function') {
				ret = this.functionCondition(condition) || ret;
			} else {

				if (condition.function) {
					ret = this.loopThrough(condition.function, this.functionCondition.bind(this)) || ret;
				}

				if (condition.grammar) {
					ret = this.loopThrough(condition.grammar, this.grammarCondition.bind(this)) || ret;
				}

				if (condition.pattern) {
					ret = this.loopThrough(condition.pattern, this.patternCondition.bind(this)) || ret;
				}

				if (condition.package) {
					ret = this.loopThrough(condition.package, this.packageCondition.bind(this)) || ret;
				}

				if (condition.setting) {
					ret = this.loopThrough(condition.setting, this.settingCondition.bind(this)) || ret;
				}
			}

			return ret;
		});
	},

	functionCondition(condition) {
		this.conditionTypes.function = true;
		const value = !!condition(atom.workspace.getActivePaneItem());

		this.functionConditions.push({
			func: condition,
			value
		});

		return value;
	},

	grammarCondition(condition) {
		this.conditionTypes.grammar = true;
		return this.reversableStringCondition(condition, (c) => this.currentGrammar && this.currentGrammar.includes(c.toLowerCase()));
	},

	patternCondition(condition) {
		this.conditionTypes.pattern = true;
		return this.reversableStringCondition(condition, (c) => {
			const item = atom.workspace.getActivePaneItem();
			const filePath = item && item.getPath && item.getPath();

			return filePath && globToRegexp(c, {extended: true}).test(filePath);
		});
	},

	packageCondition(condition) {
		this.conditionTypes.package = true;
		return this.reversableStringCondition(condition, (c) => atom.packages.isPackageActive(c));
	},

	settingCondition(condition) {
		this.conditionTypes.setting = true;
		return this.reversableStringCondition(condition, (c) => atom.config.get(c));
	},

	reversableStringCondition(condition, matches) {
		let result = false;
		let reverse = false;
		if (/^!/.test(condition)) {
			condition = condition.replace('!', '');
			reverse = true;
		}

		result = matches(condition);

		if (reverse) {
			result = !result;
		}
		return result;
	},

	storeProject() {
		const editor = atom.workspace.getActivePaneItem();
		const file = (editor && editor.buffer && editor.buffer.file) || (editor && editor.file);
		const parent = file && file.getParent();
		const project = (parent && parent.path) || null;

		if (project !== this.currentProject) {
			this.currentProject = project;
			return true;
		}

		return false;
	},

	storeGrammar() {
		const editor = atom.workspace.getActivePaneItem();
		const grammar = editor && editor.getGrammar && editor.getGrammar();
		const grammarName = (grammar && grammar.name.toLowerCase()) || null;

		if (grammarName !== this.currentGrammar) {
			this.currentGrammar = grammarName;
			return true;
		}

		return false;
	},

	removeButtons() {
		if (this.toolBar && this.toolBar.removeItems) {
			this.toolBar.removeItems();
		}
	},

	deactivate() {
		this.unregisterWatch();
		this.unregisterProjectWatch();
		this.subscriptions.dispose();
		this.subscriptions = null;
		this.changeGrammarSubscription.dispose();
		this.changeGrammarSubscription = null;
		this.removeButtons();
		this.toolBar = null;
		clearTimeout(this.functionPoll);
		this.functionPoll = null;
	},

	serialize() {}
};

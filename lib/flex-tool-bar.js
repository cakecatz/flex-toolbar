/** @babel */

import path from 'path';
import util from 'util';
import fs from 'fs-plus';
import globToRegexp from 'glob-to-regexp';
import { CompositeDisposable, watchPath } from 'atom';
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
	activeItem: null,
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
		this.changeTextEditorSubscriptions = new CompositeDisposable();

		require('atom-package-deps').install('flex-tool-bar');

		this.activeItem = this.getActiveItem();
		this.registerTypes();
		this.registerCommands();
		this.registerEvents();
		this.observeConfig();

		this.resolveConfigPath();
		this.registerWatch();

		this.resolveProjectConfigPath();
		this.registerProjectWatch();

		this.reloadToolbar();
	},

	pollFunctions() {
		if (!this.conditionTypes.function) {
			return;
		}
		const pollTimeout = atom.config.get('flex-tool-bar.pollFunctionConditionsToReloadWhenChanged');
		if (this.functionConditions.length === 0 && pollTimeout === 0) {
			return;
		}

		this.functionPoll = setTimeout(() => {

			if (!this.activeItem) {
				return;
			}

			let reload = false;

			for (const condition of this.functionConditions) {
				try {
					if (condition.value !== !!condition.func(this.activeItem.item)) {
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
				 this.reloadToolbar();
			} else {
				this.pollFunctions();
			}
		}, pollTimeout);
	},

	observeConfig() {
		this.subscriptions.add(atom.config.onDidChange('flex-tool-bar.persistentProjectToolBar', ({newValue}) => {
			this.unregisterProjectWatch();
			if (this.resolveProjectConfigPath(null, newValue)) {
				this.registerProjectWatch();
			}
			this.reloadToolbar();
		}));

		this.subscriptions.add(atom.config.onDidChange('flex-tool-bar.pollFunctionConditionsToReloadWhenChanged', ({newValue}) => {
			clearTimeout(this.functionPoll);
			if (newValue !== 0) {
				this.pollFunctions();
			}
		}));

		this.subscriptions.add(atom.config.onDidChange('flex-tool-bar.reloadToolBarWhenEditConfigFile', ({newValue}) => {
			this.unregisterWatch();
			this.unregisterProjectWatch();
			if (newValue) {
				this.registerWatch(true);
				this.registerProjectWatch(true);
			}
		}));

		this.subscriptions.add(atom.config.onDidChange('flex-tool-bar.toolBarConfigurationFilePath', ({newValue}) => {
			this.unregisterWatch();
			if (this.resolveConfigPath(newValue, false)) {
				this.registerWatch();
			}
			this.reloadToolbar();
		}));

		this.subscriptions.add(atom.config.onDidChange('flex-tool-bar.toolBarProjectConfigurationFilePath', ({newValue}) => {
			this.unregisterProjectWatch();
			if (this.resolveProjectConfigPath(newValue)) {
				this.registerProjectWatch();
			}
			this.reloadToolbar();
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
						atom.workspace.open(configPath);
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
						this.reloadToolbar();
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

		if (this.activeItem && this.activeItem.project) {
			const projectPath = path.join(this.activeItem.project, configFilePath);
			if (fs.isFileSync(projectPath)) {
				this.projectConfigFilePath = projectPath;
			} else {
				const found = fs.resolve(projectPath, 'toolbar', VALID_EXTENSIONS);
				if (found) {
					this.projectConfigFilePath = found;
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
					atom.workspace.open(this.configFilePath);
				}
			}
		}));

		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'flex-tool-bar:edit-project-config-file': () => {
				if (this.projectConfigFilePath) {
					atom.workspace.open(this.projectConfigFilePath);
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
					this.reloadToolbar();
				}
			}));

			this.subscriptions.add(atom.packages.onDidDeactivatePackage(() => {
				if (this.conditionTypes.package) {
					this.reloadToolbar();
				}
			})
			);
		}));

		this.subscriptions.add(atom.config.onDidChange(() => {
			if (this.conditionTypes.setting) {
				this.reloadToolbar();
			}
		}));

		this.subscriptions.add(atom.workspace.onDidChangeActiveTextEditor(this.onDidChangeItem.bind(this)));

		this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(this.onDidChangeItem.bind(this)));
	},

	onDidChangeItem() {
		const active = this.getActiveItem();

		if (!this.activeItem || this.activeItem.item === active.item) {
			return;
		}

		this.activeItem.item = active.item;
		this.activeItem.file = active.file;
		this.activeItem.grammar = active.grammar;

		this.changeTextEditorSubscriptions.dispose();
		this.changeTextEditorSubscriptions.clear();
		if (this.activeItem.item) {
			if (this.activeItem.item.onDidChangeGrammar) {
				this.changeTextEditorSubscriptions.add(this.activeItem.item.onDidChangeGrammar(() => {
					if (this.activeItem) {
						this.activeItem.grammar = this.getActiveItem().grammar;
						this.reloadToolbar();
					}
				}));
			}

			if (this.activeItem.item.onDidChangePath) {
				this.changeTextEditorSubscriptions.add(this.activeItem.item.onDidChangePath(() => {
					if (this.activeItem) {
						this.activeItem.file = this.getActiveItem().file;
						this.reloadToolbar();
					}
				}));
			}
		}

		const oldProject = this.activeItem.project;
		this.activeItem.project = active.project;
		if (oldProject !== this.activeItem.project) {
			this.unregisterProjectWatch();
			this.resolveProjectConfigPath();
			this.registerProjectWatch();
		}
		this.activeItem.grammar = active.grammar;
		this.reloadToolbar();
	},

	unregisterWatch() {
		if (this.configWatcher) {
			this.configWatcher.dispose();
		}
		this.configWatcher = null;
	},

	async registerWatch(shouldWatch) {
		if (shouldWatch == null) {
			shouldWatch = atom.config.get('flex-tool-bar.reloadToolBarWhenEditConfigFile');
		}
		if (!shouldWatch || !this.configFilePath) {
			return;
		}

		if (this.configWatcher) {
			this.configWatcher.dispose();
		}
		this.configWatcher = await watchPath(this.configFilePath, {}, () => {
			this.reloadToolbar(atom.config.get('flex-tool-bar.reloadToolBarNotification'));
		});
	},

	unregisterProjectWatch() {
		if (this.projectConfigWatcher) {
			this.projectConfigWatcher.dispose();
		}
		this.projectConfigWatcher = null;
	},

	async registerProjectWatch(shouldWatch) {
		if (shouldWatch == null) {
			shouldWatch = atom.config.get('flex-tool-bar.reloadToolBarWhenEditConfigFile');
		}
		if (!shouldWatch || !this.projectConfigFilePath) {
			return;
		}

		if (this.projectConfigWatcher) {
			this.projectConfigWatcher.dispose();
		}
		this.projectConfigWatcher = await watchPath(this.projectConfigFilePath, {}, () => {
			this.reloadToolbar(atom.config.get('flex-tool-bar.reloadToolBarNotification'));
		});
	},

	registerTypes() {
		const typeFiles = fs.listSync(path.join(__dirname, './types'));
		typeFiles.forEach(typeFile => {
			const typeName = path.basename(typeFile, '.js');
			this.buttonTypes[typeName] = require(typeFile);
		});
	},

	consumeToolBar(toolBar) {
		this.toolBar = toolBar('flex-toolBar');
		this.reloadToolbar();
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
			this.unfixToolBarHeight();
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

		if (!Array.isArray(toolBarButtons)) {
			console.error('Invalid Toolbar Config', toolBarButtons);
			throw new Error('Invalid Toolbar Config');
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
				button = this.buttonTypes[btn.type](this.toolBar, btn, this.getActiveItem);
			}

			if (button && button.element) {
				if (btn.mode) {
					button.element.classList.add(`tool-bar-mode-${btn.mode}`);
				}

				if (btn.style) {
					for (const propName in btn.style) {
						const style = btn.style[propName];
						button.element.style[changeCase.camelCase(propName)] = style;
					}
				}

				if (btn.hover && !disable) {
					button.element.addEventListener('mouseenter', this.onMouseEnter(btn), {passive: true});
					button.element.addEventListener('mouseleave', this.onMouseLeave(btn), {passive: true});
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

	onMouseEnter(btn) {
		return function () {
			// Map to hold the values as they were before the hover modifications.
			btn['preHoverVal'] = new Object();

			for (const propName in btn.hover) {
				const camelPropName = changeCase.camelCase(propName);
				btn.preHoverVal[camelPropName] = this.style[camelPropName];
				this.style[camelPropName] = btn.hover[propName];
			}
		};
	},

	onMouseLeave(btn) {
		return function () {
			for (const propName in btn.preHoverVal) {
				const style = btn.preHoverVal[propName];
				this.style[propName] = style;
			}
		};
	},

	removeCache(filePath) {
		delete require.cache[filePath];

		try {
			let relativeFilePath = path.relative(path.join(process.cwd(), 'resources', 'app', 'static'), filePath);
			if (process.platform === 'win32') {
				relativeFilePath = relativeFilePath.replace(/\\/g, '/');
			}
			delete snapshotResult.customRequire.cache[relativeFilePath];
		} catch (err) {
			// most likely snapshotResult does not exist
		}
	},

	loadConfig() {
		let CSON, ext;
		let config = [{
			type: 'function',
			icon: 'tools',
			callback: () => {
				this.resolveConfigPath();
				this.registerWatch();
				this.reloadToolbar();
			},
			tooltip: 'Create Global Tool Bar Config',
		}];

		if (this.configFilePath) {
			let globalConfig;
			ext = path.extname(this.configFilePath);
			this.removeCache(this.configFilePath);

			switch (ext) {
				case '.js':
				case '.json':
				case '.coffee':
					globalConfig = require(this.configFilePath);
					break;

				case '.json5':
					require('json5/lib/register');
					globalConfig = require(this.configFilePath);
					break;

				case '.cson':
					CSON = require('cson');
					globalConfig = CSON.requireCSONFile(this.configFilePath);
					break;

				default:
					// do nothing
			}

			if (globalConfig) {
				if (!Array.isArray(globalConfig)) {
					globalConfig = [globalConfig];
				}
				config = globalConfig;
			}
		}

		if (this.projectConfigFilePath) {
			let projConfig = [];
			ext = path.extname(this.projectConfigFilePath);
			this.removeCache(this.projectConfigFilePath);

			switch (ext) {
				case '.js':
				case '.json':
				case '.coffee':
					projConfig = require(this.projectConfigFilePath);
					break;

				case '.json5':
					require('json5/lib/register');
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
		const value = !!condition(this.activeItem ? this.activeItem.item : null);

		this.functionConditions.push({
			func: condition,
			value
		});

		return value;
	},

	getActiveItem() {
		const active = {
			item: null,
			grammar: null,
			file: null,
			project: null,
		};

		const editor = atom.workspace.getActiveTextEditor();
		if (editor) {
			const grammar = editor.getGrammar();
			active.item = editor;
			active.grammar = (grammar && grammar.name.toLowerCase()) || null;
			active.file = (editor && editor.buffer && editor.buffer.file && editor.buffer.file.getPath()) || null;
		} else {
			const item = atom.workspace.getCenter().getActivePaneItem();
			if (item && item.file) {
				active.item = item;
				active.file = item.file.getPath();
			}
		}

		if (active.file) {
			const [project] = atom.project.relativizePath(active.file);
			if (project) {
				active.project = project;
			}
		}

		return active;
	},

	grammarCondition(condition) {
		this.conditionTypes.grammar = true;
		return this.reversableStringCondition(condition, (c) => {
			return this.activeItem && this.activeItem.grammar && this.activeItem.grammar.includes(c.toLowerCase());
		});
	},

	patternCondition(condition) {
		this.conditionTypes.pattern = true;
		return this.reversableStringCondition(condition, (c) => {
			return this.activeItem && this.activeItem.file && globToRegexp(c, {extended: true}).test(this.activeItem.file);
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
		this.changeTextEditorSubscriptions.dispose();
		this.changeTextEditorSubscriptions = null;
		this.removeButtons();
		this.toolBar = null;
		clearTimeout(this.functionPoll);
		this.functionPoll = null;
		this.activeItem = null;
	},

	serialize() {}
};

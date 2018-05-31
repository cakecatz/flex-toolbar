const flexToolBar = require('../lib/flex-tool-bar');
const path = require('path');

describe('FlexToolBar', function () {
	beforeEach(async function () {
		await atom.packages.activatePackage('tool-bar');
		await atom.packages.activatePackage('flex-tool-bar');
	});

	describe('activate', function () {
		it('should store grammar', async function () {
			await atom.packages.activatePackage('language-javascript');
			const editor = await atom.workspace.open('./fixtures/sample.js');

			expect(flexToolBar.activeItem.grammar).toBe(editor.getGrammar().name.toLowerCase());
		});
	});

	describe('config type', function () {
		it('should load .json', function () {
			flexToolBar.configFilePath = path.resolve(__dirname, './fixtures/config/config.json');
			expect(flexToolBar.loadConfig()[0].type).toBe('json');
		});

		it('should load .js', function () {
			flexToolBar.configFilePath = path.resolve(__dirname, './fixtures/config/config.js');
			expect(flexToolBar.loadConfig()[0].type).toBe('js');
		});

		it('should load .json5', function () {
			flexToolBar.configFilePath = path.resolve(__dirname, './fixtures/config/config.json5');
			expect(flexToolBar.loadConfig()[0].type).toBe('json5');
		});

		it('should load .coffee', function () {
			flexToolBar.configFilePath = path.resolve(__dirname, './fixtures/config/config.coffee');
			expect(flexToolBar.loadConfig()[0].type).toBe('coffee');
		});

		it('should load .cson', function () {
			flexToolBar.configFilePath = path.resolve(__dirname, './fixtures/config/config.cson');
			expect(flexToolBar.loadConfig()[0].type).toBe('cson');
		});
	});

	describe('default config', function () {
		it('should load .json', function () {
			flexToolBar.configFilePath = path.resolve(__dirname, '../lib/defaults/toolbar.json');
			expect(flexToolBar.loadConfig()[0]).toEqual(jasmine.objectContaining({
		    type: 'button',
		    icon: 'gear',
		    callback: 'flex-tool-bar:edit-config-file',
		    tooltip: 'Edit Tool Bar'
		  }));
		});

		it('should load .js', function () {
			flexToolBar.configFilePath = path.resolve(__dirname, '../lib/defaults/toolbar.js');
			expect(flexToolBar.loadConfig()[0]).toEqual(jasmine.objectContaining({
		    type: 'button',
		    icon: 'gear',
		    callback: 'flex-tool-bar:edit-config-file',
		    tooltip: 'Edit Tool Bar'
		  }));
		});

		it('should load .json5', function () {
			flexToolBar.configFilePath = path.resolve(__dirname, '../lib/defaults/toolbar.json5');
			expect(flexToolBar.loadConfig()[0]).toEqual(jasmine.objectContaining({
		    type: 'button',
		    icon: 'gear',
		    callback: 'flex-tool-bar:edit-config-file',
		    tooltip: 'Edit Tool Bar'
		  }));
		});

		it('should load .coffee', function () {
			flexToolBar.configFilePath = path.resolve(__dirname, '../lib/defaults/toolbar.coffee');
			expect(flexToolBar.loadConfig()[0]).toEqual(jasmine.objectContaining({
		    type: 'button',
		    icon: 'gear',
		    callback: 'flex-tool-bar:edit-config-file',
		    tooltip: 'Edit Tool Bar'
		  }));
		});

		it('should load .cson', function () {
			flexToolBar.configFilePath = path.resolve(__dirname, '../lib/defaults/toolbar.cson');
			expect(flexToolBar.loadConfig()[0]).toEqual(jasmine.objectContaining({
		    type: 'button',
		    icon: 'gear',
		    callback: 'flex-tool-bar:edit-config-file',
		    tooltip: 'Edit Tool Bar'
		  }));
		});
	});

	describe('button types', function () {
		beforeEach(function () {
			spyOn(flexToolBar.toolBar, 'addButton');
		});
		it('should load a url', function () {
			flexToolBar.addButtons([{
				type: 'url',
				icon: 'octoface',
				url: 'http://github.com',
				tooltip: 'Github Page'
			}]);

			expect(flexToolBar.toolBar.addButton).toHaveBeenCalledWith(jasmine.objectContaining({
				icon: 'octoface',
				data: 'http://github.com',
				tooltip: 'Github Page'
			}));
		});
		it('should load a file', function () {
			flexToolBar.addButtons([{
				type: 'file',
				icon: 'octoface',
				file: 'README.md',
				tooltip: 'Github Page'
			}]);

			expect(flexToolBar.toolBar.addButton).toHaveBeenCalledWith(jasmine.objectContaining({
				icon: 'octoface',
				data: 'README.md',
				tooltip: 'Github Page'
			}));
		});
		it('should load a spacer', function () {
			spyOn(flexToolBar.toolBar, 'addSpacer');
			flexToolBar.addButtons([{
				type: 'spacer'
			}]);

			expect(flexToolBar.toolBar.addSpacer).toHaveBeenCalledWith({
				priority: 45
			});
		});
		it('should load a button', function () {
			flexToolBar.addButtons([{
				type: 'button',
				icon: 'columns',
				iconset: 'fa',
				tooltip: 'Split Right',
				callback: 'pane:split-right',
			}]);

			expect(flexToolBar.toolBar.addButton).toHaveBeenCalledWith(jasmine.objectContaining({
				icon: 'columns',
				iconset: 'fa',
				tooltip: 'Split Right',
				callback: 'pane:split-right'
			}));
		});
		it('should load a function', function () {
			const callback = (target) => target;
			flexToolBar.addButtons([{
				type: 'function',
				icon: 'bug',
				callback: callback,
				tooltip: 'Debug Target'
			}]);

			expect(flexToolBar.toolBar.addButton).toHaveBeenCalledWith(jasmine.objectContaining({
				icon: 'bug',
				data: callback,
				tooltip: 'Debug Target'
			}));
		});
	});

	describe('text and html options', function () {
		beforeEach(function () {
			spyOn(flexToolBar.toolBar, 'addButton');
			this.obj = {
				text: 'text',
				html: true
			};
		});
		it('should allow text and html options on button', function () {
			flexToolBar.addButtons([{
				type: 'button',
				text: this.obj.text,
				html: this.obj.html
			}]);

			expect(flexToolBar.toolBar.addButton).toHaveBeenCalledWith(jasmine.objectContaining(this.obj));
		});
		it('should allow text and html options on file', function () {
			flexToolBar.addButtons([{
				type: 'file',
				text: this.obj.text,
				html: this.obj.html
			}]);

			expect(flexToolBar.toolBar.addButton).toHaveBeenCalledWith(jasmine.objectContaining(this.obj));
		});
		it('should allow text and html options on function', function () {
			flexToolBar.addButtons([{
				type: 'function',
				text: this.obj.text,
				html: this.obj.html
			}]);

			expect(flexToolBar.toolBar.addButton).toHaveBeenCalledWith(jasmine.objectContaining(this.obj));
		});
		it('should allow text and html options on url', function () {
			flexToolBar.addButtons([{
				type: 'url',
				text: this.obj.text,
				html: this.obj.html
			}]);

			expect(flexToolBar.toolBar.addButton).toHaveBeenCalledWith(jasmine.objectContaining(this.obj));
		});
	});

	describe('observed events', function () {
		it('should observe grammar change', async function () {
			await atom.packages.activatePackage('language-javascript');
			await atom.packages.activatePackage('language-text');
			await atom.workspace.open('./fixtures/sample.js');

			const editor = atom.workspace.getActiveTextEditor();
			editor.setGrammar(atom.grammars.grammarForScopeName('source.js'));

			expect(flexToolBar.activeItem.grammar).toBe('javascript');

			editor.setGrammar(atom.grammars.grammarForScopeName('text.plain'));

			expect(flexToolBar.activeItem.grammar).toBe('plain text');
		});
	});

	describe('grammar condition', function () {
		it('should check @activeItem.grammar', function () {
			flexToolBar.activeItem.grammar = 'js';

			const match = flexToolBar.checkConditions('js');
			const notMatch = flexToolBar.checkConditions('!js');
			expect(match).toBe(true);
			expect(notMatch).toBe(false);
		});

		it('should check .grammar', function () {
			flexToolBar.activeItem.grammar = 'js';

			const match = flexToolBar.checkConditions({grammar: 'js'});
			const notMatch = flexToolBar.checkConditions({grammar: '!js'});
			expect(match).toBe(true);
			expect(notMatch).toBe(false);
		});
	});

	describe('pattern condition', function () {
		it('should check .pattern', async function () {
			await atom.workspace.open('./fixtures/sample.js');
			const matchJs = flexToolBar.checkConditions({pattern: '*.js'});
			const matchCoffee = flexToolBar.checkConditions({pattern: '*.coffee'});
			expect(matchJs).toBe(true);
			expect(matchCoffee).toBe(false);
		});
	});

	describe('setting condition', function () {
		it('should check .setting', async function () {
			await atom.config.set('test.trueSetting', true);
			await atom.config.set('test.falseSetting', false);

			const matchNonExistant = flexToolBar.checkConditions({setting: 'test.nonExistantSetting'});
			const matchTrue = flexToolBar.checkConditions({setting: 'test.trueSetting'});
			const matchFalse = flexToolBar.checkConditions({setting: 'test.falseSetting'});
			expect(matchNonExistant).toBe(false);
			expect(matchTrue).toBe(true);
			expect(matchFalse).toBe(false);
		});
	});

	describe('image file', function () {
		beforeEach(async function () {
			await atom.packages.activatePackage('image-view');
		});
		it('should set grammar to null', async function () {
			await atom.packages.activatePackage('language-javascript');
			await atom.workspace.open('./fixtures/sample.js');
			expect(flexToolBar.activeItem.grammar).toBe('javascript');

			await atom.workspace.open('./fixtures/pixel.png');
			expect(flexToolBar.activeItem.grammar).toBeNull();
		});
		it('should check .pattern', async function () {
			let matchPng, matchJpg;

			await atom.workspace.open('./fixtures/pixel.png');
			matchPng = flexToolBar.checkConditions({pattern: '*.png'});
			matchJpg = flexToolBar.checkConditions({pattern: '*.jpg'});
			expect(matchPng).toBe(true);
			expect(matchJpg).toBe(false);

			await atom.workspace.open('./fixtures/pixel.jpg');
			matchPng = flexToolBar.checkConditions({pattern: '*.png'});
			matchJpg = flexToolBar.checkConditions({pattern: '*.jpg'});
			expect(matchPng).toBe(false);
			expect(matchJpg).toBe(true);
		});
	});

	describe('package condition', function () {
		it('should check .package', async function () {
			let notMatch, match;

			notMatch = flexToolBar.checkConditions({package: '!language-text'});
			match = flexToolBar.checkConditions({package: 'language-text'});
			expect(notMatch).toBe(true);
			expect(match).toBe(false);

			await atom.packages.activatePackage('language-text');

			notMatch = flexToolBar.checkConditions({package: '!language-text'});
			match = flexToolBar.checkConditions({package: 'language-text'});
			expect(notMatch).toBe(false);
			expect(match).toBe(true);
		});
	});

	describe('function condition', function () {
		beforeEach(function () {
			this.pollTimeout = atom.config.get('flex-tool-bar.pollFunctionConditionsToReloadWhenChanged');
			jasmine.clock().install();
		});

		afterEach(function () {
			jasmine.clock().uninstall();
		});

		it('should check condition and return boolean', function () {
			let match;

			match = flexToolBar.checkConditions(() => true);
			expect(match).toBe(true);

			match = flexToolBar.checkConditions(() => 1);
			expect(match).toBe(true);

			match = flexToolBar.checkConditions(() => false);
			expect(match).toBe(false);

			match = flexToolBar.checkConditions(() => 0);
			expect(match).toBe(false);
		});

		it('should poll function conditions', async function () {
			await atom.workspace.open('./fixtures/sample.js');

			spyOn(flexToolBar, 'pollFunctions').and.callThrough();
			spyOn(flexToolBar, 'reloadToolbar').and.callThrough();
			spyOn(flexToolBar, 'loadConfig').and.returnValues([{
				text: 'test',
				callback: 'application:about',
				show: {
					function: (editor) => editor.isModified()
				}
			}]);

			flexToolBar.reloadToolbar();

			expect(flexToolBar.functionConditions.length).toBe(1);

			jasmine.clock().tick(this.pollTimeout * 3);

			expect(flexToolBar.pollFunctions).toHaveBeenCalledTimes(4);
			expect(flexToolBar.reloadToolbar).toHaveBeenCalledTimes(1);
		});

		it('should not poll if no function conditions', async function () {
			await atom.workspace.open('./fixtures/sample.js');

			spyOn(flexToolBar, 'pollFunctions').and.callThrough();
			spyOn(flexToolBar, 'reloadToolbar').and.callThrough();
			spyOn(flexToolBar, 'loadConfig').and.returnValues([{
				text: 'test',
				callback: 'application:about',
				show: {
					pattern: '*.js'
				}
			}]);

			flexToolBar.reloadToolbar();

			expect(flexToolBar.functionConditions.length).toBe(0);

			jasmine.clock().tick(this.pollTimeout * 2);

			expect(flexToolBar.pollFunctions).toHaveBeenCalledTimes(1);
			expect(flexToolBar.reloadToolbar).toHaveBeenCalledTimes(1);
		});

		it('should reload if a function condition changes', async function () {
			const textEditor = await atom.workspace.open('./fixtures/sample.js');

			spyOn(flexToolBar, 'pollFunctions').and.callThrough();
			spyOn(flexToolBar, 'reloadToolbar').and.callThrough();
			spyOn(flexToolBar, 'loadConfig').and.returnValues([{
				text: 'test',
				callback: 'application:about',
				show: {
					function: (editor) => editor.isModified()
				}
			}]);

			flexToolBar.reloadToolbar();

			expect(flexToolBar.pollFunctions).toHaveBeenCalledTimes(1);
			expect(flexToolBar.reloadToolbar).toHaveBeenCalledTimes(1);

			jasmine.clock().tick(this.pollTimeout);

			spyOn(textEditor, 'isModified').and.returnValues(true);

			jasmine.clock().tick(this.pollTimeout * 2);

			expect(flexToolBar.pollFunctions).toHaveBeenCalledTimes(3);
			expect(flexToolBar.reloadToolbar).toHaveBeenCalledTimes(2);
		});
	});

	describe('correct project config path', function () {
		beforeEach(function () {
			flexToolBar.configFilePath = path.resolve(__dirname, './fixtures/config/config.json');
		});

		it('should load toolbar.cson from specified path', async function () {
			atom.config.set('flex-tool-bar.toolBarProjectConfigurationFilePath', '.');
			await atom.workspace.open(path.join(__dirname, 'fixtures/sample.js'));
			expect(flexToolBar.projectConfigFilePath).toBe(path.resolve(__dirname, './fixtures/toolbar.cson'));
		});

		it('should load specified config file', async function () {
			atom.config.set('flex-tool-bar.toolBarProjectConfigurationFilePath', './config/config.cson');
			await atom.workspace.open(path.join(__dirname, 'fixtures/sample.js'));
			expect(flexToolBar.projectConfigFilePath).toBe(path.resolve(__dirname, './fixtures/config/config.cson'));
		});

		it('should not load if path equals global config file', async function () {
			atom.config.set('flex-tool-bar.toolBarProjectConfigurationFilePath', './config/config.json');
			await atom.workspace.open(path.join(__dirname, 'fixtures/sample.js'));
			expect(flexToolBar.projectConfigFilePath).toBe(null);
		});
	});

	describe('persistent project tool bar', function () {
		beforeEach(async function () {
			this.project1Config = path.join(__dirname, 'fixtures/project1/toolbar.cson');
			this.project2Config = path.join(__dirname, 'fixtures/project2/toolbar.cson');
			this.project1Sample = path.join(__dirname, 'fixtures/project1/sample.js');
			this.project2Sample = path.join(__dirname, 'fixtures/project2/sample.js');
			this.project3Sample = path.join(__dirname, 'fixtures/project3/sample.js');
			this.settingsView = 'atom://config/packages/flex-toolbar';

			await atom.packages.activatePackage('settings-view');
			flexToolBar.projectConfigFilePath = null;
			atom.project.setPaths([
				path.join(__dirname, 'fixtures/project1/'),
				path.join(__dirname, 'fixtures/project2/'),
				path.join(__dirname, 'fixtures/project3/'),
			]);
		});
		it('should not persistent when an editor is open that does not have a project config', async function () {
			atom.config.set('flex-tool-bar.persistentProjectToolBar', false);

			await atom.workspace.open(this.project1Sample);
			expect(flexToolBar.projectConfigFilePath).toBe(this.project1Config);

			await atom.workspace.open(this.settingsView);
			expect(flexToolBar.projectConfigFilePath).toBeNull();

			await atom.workspace.open(this.project3Sample);
			expect(flexToolBar.projectConfigFilePath).toBeNull();

			await atom.workspace.open(this.project2Sample);
			expect(flexToolBar.projectConfigFilePath).toBe(this.project2Config);

			await atom.workspace.open(this.settingsView);
			expect(flexToolBar.projectConfigFilePath).toBeNull();

			await atom.workspace.open(this.project3Sample);
			expect(flexToolBar.projectConfigFilePath).toBeNull();

			await atom.workspace.open(this.project1Sample);
			expect(flexToolBar.projectConfigFilePath).toBe(this.project1Config);
		});

		it('should persistent when an editor is open that does not have a project config', async function () {
			atom.config.set('flex-tool-bar.persistentProjectToolBar', true);

			await atom.workspace.open(this.project1Sample);
			expect(flexToolBar.projectConfigFilePath).toBe(this.project1Config);

			await atom.workspace.open(this.settingsView);
			expect(flexToolBar.projectConfigFilePath).toBe(this.project1Config);

			await atom.workspace.open(this.project3Sample);
			expect(flexToolBar.projectConfigFilePath).toBe(this.project1Config);

			await atom.workspace.open(this.project2Sample);
			expect(flexToolBar.projectConfigFilePath).toBe(this.project2Config);

			await atom.workspace.open(this.settingsView);
			expect(flexToolBar.projectConfigFilePath).toBe(this.project2Config);

			await atom.workspace.open(this.project3Sample);
			expect(flexToolBar.projectConfigFilePath).toBe(this.project2Config);

			await atom.workspace.open(this.project1Sample);
			expect(flexToolBar.projectConfigFilePath).toBe(this.project1Config);
		});
	});

	describe('removeCache', function () {
		it('should reload the module from the file', function (done) {
			const fs = require('fs');
			const file = path.join(__dirname, 'fixtures', 'removeCache.js');

			fs.writeFile(file, 'module.exports = 1;', (err) => {
				if (err) {
					throw err;
				}
				expect(require(file)).toBe(1);
				fs.writeFile(file, 'module.exports = 2;', (err2) => {
					if (err2) {
						throw err2;
					}
					expect(require(file)).toBe(1);
					flexToolBar.removeCache(file);
					expect(require(file)).toBe(2);
					fs.unlink(file, (err3) => {
						if (err3) {
							throw err3;
						}
						done();
					});
				});
			});
		});
	});

	describe('button style', function () {
		it('should style the button', function () {
			const [button] = flexToolBar.addButtons([{
				type: 'button',
				icon: 'octoface',
				style: {
					color: 'rgb(12, 34, 56)'
				}
			}]);

			expect(button.element.style.color).toBe('rgb(12, 34, 56)');
		});

		it('should change style on hover', function () {
			const [button] = flexToolBar.addButtons([{
				type: 'button',
				icon: 'octoface',
				style: {
					color: 'rgb(12, 34, 56)'
				},
				hover: {
					color: 'rgb(65, 43, 21)'
				}
			}]);

			button.element.dispatchEvent(new global.MouseEvent('mouseenter'));
			expect(button.element.style.color).toBe('rgb(65, 43, 21)');

			button.element.dispatchEvent(new global.MouseEvent('mouseleave'));
			expect(button.element.style.color).toBe('rgb(12, 34, 56)');
		});

		it('should remove style on mouseleave', function () {
			const [button] = flexToolBar.addButtons([{
				type: 'button',
				icon: 'octoface',
				hover: {
					color: 'rgb(65, 43, 21)'
				}
			}]);

			button.element.dispatchEvent(new global.MouseEvent('mouseenter'));
			expect(button.element.style.color).toBe('rgb(65, 43, 21)');

			button.element.dispatchEvent(new global.MouseEvent('mouseleave'));
			expect(button.element.style.color).toBe('');
		});
	});

	if (!global.headless) {
		// show linting errors in atom test window
		describe('linting', function () {
			it('should pass linting', function (done) {
				const { exec } = require('child_process');
				exec('npm run lint', {
					cwd: __dirname
				}, function (err, stdout) {
					if (err) {
						expect(stdout).toBeFalsy();
					}

					done();
				});
			}, 60000);
		});
	}
});

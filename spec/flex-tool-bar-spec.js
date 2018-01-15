const flexToolBar = require('../lib/flex-tool-bar');
const path = require('path');

describe('FlexToolBar', function () {
	beforeEach(async function () {
		await atom.packages.activatePackage('tool-bar');
		await atom.packages.activatePackage('flex-tool-bar');
	});

	describe('activate', function () {
		it('should store grammar', async function () {
			await atom.workspace.open('./fixtures/sample.js');
			this.editor = atom.workspace.getActiveTextEditor();
			expect(flexToolBar.currentGrammar).toBe(this.editor.getGrammar().name.toLowerCase());
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
});

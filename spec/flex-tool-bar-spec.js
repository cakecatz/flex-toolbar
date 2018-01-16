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

			expect(flexToolBar.currentGrammar).toBe(editor.getGrammar().name.toLowerCase());
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

	describe('grammar condition', function () {
		it('should check @currentGrammar', function () {
			flexToolBar.currentGrammar = 'js';

			const match = flexToolBar.condition('js');
			const notMatch = flexToolBar.condition('!js');
			expect(match).toBe(true);
			expect(notMatch).toBe(false);
		});

		it('should check .grammar', function () {
			flexToolBar.currentGrammar = 'js';

			const match = flexToolBar.condition({grammar: 'js'});
			const notMatch = flexToolBar.condition({grammar: '!js'});
			expect(match).toBe(true);
			expect(notMatch).toBe(false);
		});
	});


	describe('pattern condition', function () {
		it('should check .pattern', async function () {
			await atom.workspace.open('./fixtures/sample.js');

			const matchJs = flexToolBar.condition({pattern: '*.js'});
			const matchCoffee = flexToolBar.condition({pattern: '*.coffee'});
			expect(matchJs).toBe(true);
			expect(matchCoffee).toBe(false);
		});
	});

	describe('image file', function () {
		beforeEach(async function () {
			await atom.packages.activatePackage('image-view');
		});
		it('should set grammar to null', async function () {
			await atom.workspace.open('./fixtures/pixel.png');
			expect(flexToolBar.currentGrammar).toBeNull();
		});
		it('should check .pattern', async function () {
			let matchPng, matchJpg;

			await atom.workspace.open('./fixtures/pixel.png');
			matchPng = flexToolBar.condition({pattern: '*.png'});
			matchJpg = flexToolBar.condition({pattern: '*.jpg'});
			expect(matchPng).toBe(true);
			expect(matchJpg).toBe(false);

			await atom.workspace.open('./fixtures/pixel.jpg');
			matchPng = flexToolBar.condition({pattern: '*.png'});
			matchJpg = flexToolBar.condition({pattern: '*.jpg'});
			expect(matchPng).toBe(false);
			expect(matchJpg).toBe(true);
		});
	});

	describe('package condition', function () {
		it('should check .package', async function () {
			let notMatch, match;

			notMatch = flexToolBar.condition({package: '!language-text'});
			match = flexToolBar.condition({package: 'language-text'});
			expect(notMatch).toBe(true);
			expect(match).toBe(false);

			await atom.packages.activatePackage('language-text');

			notMatch = flexToolBar.condition({package: '!language-text'});
			match = flexToolBar.condition({package: 'language-text'});
			expect(notMatch).toBe(false);
			expect(match).toBe(true);
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

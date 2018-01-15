const path = require('path');
const ToolBarCson = path.join(__dirname, './toolbar.cson');

describe('FlexToolBar', function () {

	beforeEach(async function () {
		this.workspaceElement = atom.views.getView(atom.workspace);
		atom.config.set('flex-tool-bar.toolBarConfigurationFilePath', ToolBarCson);

		this.toolBar = (await atom.packages.activatePackage('tool-bar')).mainModule;
		this.flexToolBar = (await atom.packages.activatePackage('flex-tool-bar')).mainModule;

		await atom.packages.activatePackage('language-text');

		await atom.packages.activatePackage('language-javascript');

		await atom.workspace.open('sample.js');

		this.editor = atom.workspace.getActiveTextEditor();
	});
	describe('@activate', function () {
		it('store grammar', function () {
			expect(this.flexToolBar.currentGrammar).toBe(this.editor.getGrammar().name.toLowerCase());
		});
	});
});

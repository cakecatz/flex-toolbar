path = require 'path'
fs = require 'fs-plus'
treeMatch = require 'tree-match-sync'
treeIsInstalled = treeMatch.treeIsInstalled()
module.exports =
  toolBar: null
  configFilePath: null
  currentGrammar: null
  buttonTypes: []

  config:
    toolBarConfigurationFilePath:
      type: 'string'
      default: path.join process.env.ATOM_HOME, 'toolbar.cson'
    showConfigButton:
      type: 'boolean'
      default: true
    reloadToolBarWhenEditConfigFile:
      type: 'boolean'
      default: true
    useBrowserPlusWhenItIsActive:
      type: 'boolean'
      default: false

  activate: ->
    require('atom-package-deps').install('flex-tool-bar')

    @storeGrammar()
    @resolveConfigPath()
    @registerTypes()

    @subscriptions = atom.commands.add 'atom-workspace',
      'flex-tool-bar:edit-config-file': =>
        atom.workspace.open @configFilePath
    if atom.config.get('flex-tool-bar.reloadToolBarWhenEditConfigFile')
      watch = require 'node-watch'
      watch @configFilePath, =>
        @reloadToolbar()

    @subscriptions.add atom.config.onDidChange 'flex-tool-bar.showConfigButton', =>
      @reloadToolbar true

    atom.workspace.onDidChangeActivePaneItem (item) =>
      if @storeGrammar()
        @reloadToolbar true

  registerTypes: ->
    typeFiles = fs.listSync path.join __dirname, '../types'
    typeFiles.forEach (typeFile) =>
      typeName = path.basename typeFile, '.coffee'
      @buttonTypes[typeName] = require typeFile

  consumeToolBar: (toolBar) ->
    @toolBar = toolBar 'flex-toolBar'
    @reloadToolbar true

  reloadToolbar: (init) ->
    return unless @toolBar?
    try
      toolBarButtons = @loadConfig()
      # Remove and add buttons after successful JSON parse
      @removeButtons()
      @addButtons toolBarButtons
      if atom.config.get('flex-tool-bar.showConfigButton')
        @toolBar.addButton
          icon: 'gear'
          callback: 'flex-tool-bar:edit-config-file'
          tooltip: 'Edit ToolBar'
          priority: 45
        @toolBar.addSpacer priority: 45
      atom.notifications.addSuccess 'The tool-bar was successfully updated.' if not init
    catch error
      atom.notifications.addError 'Your `toolbar.json` is **not valid JSON**!' if not init
      console.debug 'JSON is not valid'
      console.error error

  addButtons: (toolBarButtons) ->
    if toolBarButtons?
      devMode = atom.inDevMode()
      for btn in toolBarButtons

        if ( btn.hide? && @grammarCondition(btn.hide) ) or ( btn.show? && !@grammarCondition(btn.show) )
          continue

        continue if btn.mode and btn.mode is 'dev' and not devMode

        button = @buttonTypes[btn.type](@toolBar, btn) if @buttonTypes[btn.type]

        button.addClass "tool-bar-mode-#{btn.mode}" if btn.mode

        if btn.style?
          for k, v of btn.style
            button.css(k, v)

        if ( btn.disable? && @grammarCondition(btn.disable) ) or ( btn.enable? && !@grammarCondition(btn.enable) )
          button.setEnabled false

  resolveConfigPath: ->
    @configFilePath = atom.config.get('flex-tool-bar.toolBarConfigurationFilePath')

    if !fs.isFileSync @configFilePath
      configDir = process.env.ATOM_HOME
      @configFilePath = fs.resolve configDir, 'toolbar', ['cson', 'json5', 'json']
      unless @configFilePath
        @configFilePath = path.join configDir, 'toolbar.cson'


  loadConfig: ->
    ext = path.extname @configFilePath

    switch ext
      when '.json'
        config = require @configFilePath
        delete require.cache[@configFilePath]

      when '.json5'
        require 'json5/lib/require'
        config = require @configFilePath
        delete require.cache[@configFilePath]

      when '.cson'
        CSON = require 'cson'
        config = CSON.requireCSONFile @configFilePath

    return config

  getActiveProject: () ->
    activePanePath = atom.workspace.getActiveTextEditor().getPath()
    projectsPath = atom.project.getPaths()

    for projectPath in projectsPath
      return projectPath if activePanePath.replace(projectPath, '') isnt activePanePath

    return activePanePath.replace /[^\/]+\.(.*?)$/, ''

  grammarCondition: (grammars) ->
    result = false
    grammarType = Object.prototype.toString.call grammars
    grammars = [grammars] if grammarType is '[object String]' or grammarType is '[object Object]'
    filePath = atom.workspace.getActiveTextEditor()?.getPath()

    for grammar in grammars
      reverse = false

      if Object.prototype.toString.call(grammar) is '[object Object]'
        if !treeIsInstalled
          atom.notifications.addError '[Tree](http://mama.indstate.edu/users/ice/tree/) is not installed, please install it.'
          continue

        if filePath is undefined
          continue

        activePath = @getActiveProject()
        options = if grammar.options then grammar.options else {}
        tree = treeMatch activePath, grammar.pattern, options
        return true if Object.prototype.toString.call(tree) is '[object Array]' and tree.length > 0
      else
        if /^!/.test grammar
          grammar = grammar.replace '!', ''
          reverse = true

        if /^[^\/]+\.(.*?)$/.test grammar
          result = true if filePath isnt undefined and filePath.match(grammar)?.length > 0
        else
          result = true if @currentGrammar? and @currentGrammar.includes grammar.toLowerCase()

      result = !result if reverse

      return true if result is true

    return false

  storeGrammar: ->
    editor = atom.workspace.getActiveTextEditor()
    if editor && editor.getGrammar().name.toLowerCase() isnt @currentGrammar
      @currentGrammar = editor.getGrammar().name.toLowerCase()
      return true
    else
      return false

  removeButtons: ->
    @toolBar.removeItems() if @toolBar?

  deactivate: ->
    @subscriptions.dispose()
    @removeButtons()

  serialize: ->

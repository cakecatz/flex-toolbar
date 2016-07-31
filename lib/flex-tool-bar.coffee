path = require 'path'
fs = require 'fs-plus'
chokidar = require 'chokidar'
treeMatch = require 'tree-match-sync'
{ CompositeDisposable } = require 'atom'
treeIsInstalled = treeMatch.treeIsInstalled()
module.exports =
  toolBar: null
  configFilePath: null
  currentGrammar: null
  currentProject: null
  buttonTypes: []
  watchList: []

  config:
    toolBarConfigurationFilePath:
      type: 'string'
      default: ''
    reloadToolBarWhenEditConfigFile:
      type: 'boolean'
      default: true
    useBrowserPlusWhenItIsActive:
      type: 'boolean'
      default: false

  activate: ->
    require('atom-package-deps').install('flex-tool-bar')

    return unless @resolveConfigPath()

    @subscriptions = new CompositeDisposable
    @watcherList = []

    @resolveProjectConfigPath()
    @storeProject()
    @storeGrammar()
    @registerTypes()
    @registerCommand()
    @registerEvent()
    @registerWatch()
    @registerProjectWatch()

    @reloadToolbar(false)

  resolveConfigPath: ->
    @configFilePath = atom.config.get 'flex-tool-bar.toolBarConfigurationFilePath'

    # Default directory
    @configFilePath = process.env.ATOM_HOME unless @configFilePath

    # If configFilePath is a folder, check for `toolbar.(json|cson|json5)` file
    unless fs.isFileSync(@configFilePath)
      @configFilePath = fs.resolve @configFilePath, 'toolbar', ['cson', 'json5', 'json']

    return true if @configFilePath

    unless @configFilePath
      @configFilePath = path.join process.env.ATOM_HOME, 'toolbar.cson'
      defaultConfig = '''
# This file is used by Flex Tool Bar to create buttons on your Tool Bar.
# For more information how to use this package and create your own buttons,
#   read the documentation on https://atom.io/packages/flex-tool-bar

[
  {
    type: "button"
    icon: "gear"
    callback: "flex-tool-bar:edit-config-file"
    tooltip: "Edit Tool Bar"
  }
  {
    type: "spacer"
  }
]
'''
      try
        fs.writeFileSync @configFilePath, defaultConfig
        atom.notifications.addInfo 'We created a Tool Bar config file for you...', detail: @configFilePath
        return true
      catch err
        @configFilePath = null
        atom.notifications.addError 'Something went wrong creating the Tool Bar config file! Please restart Atom to try again.'
        console.error err
        return false

  resolveProjectConfigPath: ->
    @projectToolbarConfigPath = null
    editor = atom.workspace.getActiveTextEditor()

    if editor?.buffer?.file?.getParent()?.path?
      projectCount = atom.project.getPaths().length
      count = 0
      while count < projectCount
        pathToCheck = atom.project.getPaths()[count]
        if editor.buffer.file.getParent().path.includes(pathToCheck)
          @projectToolbarConfigPath = fs.resolve pathToCheck, 'toolbar', ['cson', 'json5', 'json']
        count++

    if @projectToolbarConfigPath is @configFilePath
      @projectToolbarConfigPath = null

    return true if @projectToolbarConfigPath

  registerCommand: ->
    @subscriptions.add atom.commands.add 'atom-workspace',
      'flex-tool-bar:edit-config-file': =>
        atom.workspace.open @configFilePath if @configFilePath

  registerEvent: ->
    @subscriptions.add atom.workspace.onDidChangeActivePaneItem (item) =>

      if @didChangeGrammar()
        @storeGrammar()
        @reloadToolbar()
        return

      if @storeProject()
        @switchProject()
        return


  registerWatch: ->
    if atom.config.get('flex-tool-bar.reloadToolBarWhenEditConfigFile')
      watcher = chokidar.watch @configFilePath
        .on 'change', =>
          @reloadToolbar(true)
      @watcherList.push watcher

  registerProjectWatch: ->
    if @projectToolbarConfigPath and @watchList.indexOf(@projectToolbarConfigPath) < 0
      @watchList.push @projectToolbarConfigPath
      watcher = chokidar.watch @projectToolbarConfigPath
        .on 'change', (event, filename) =>
          @reloadToolbar(true)
      @watcherList.push watcher

  switchProject: ->
    @resolveProjectConfigPath()
    @registerProjectWatch()
    @reloadToolbar(false)

  registerTypes: ->
    typeFiles = fs.listSync path.join __dirname, '../types'
    typeFiles.forEach (typeFile) =>
      typeName = path.basename typeFile, '.coffee'
      @buttonTypes[typeName] = require typeFile

  consumeToolBar: (toolBar) ->
    @toolBar = toolBar 'flex-toolBar'
    @reloadToolbar(false)

  reloadToolbar: (withNotification=false) ->
    return unless @toolBar?
    try
      @fixToolBarHeight()
      toolBarButtons = @loadConfig()
      @removeButtons()
      @addButtons toolBarButtons
      atom.notifications.addSuccess 'The tool-bar was successfully updated.' if withNotification
      @unfixToolBarHeight()
    catch error
      @unfixToolBarHeight()
      atom.notifications.addError 'Your `toolbar.json` is **not valid JSON**!'
      console.error error

  fixToolBarHeight: ->
    @toolBar.toolBar.element.style.height = "#{@toolBar.toolBar.element.offsetHeight}px"

  unfixToolBarHeight: ->
    @toolBar.toolBar.element.style.height = null

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

    if @projectToolbarConfigPath
      ext = path.extname @projectToolbarConfigPath

      switch ext
        when '.json'
          projConfig = require @projectToolbarConfigPath
          delete require.cache[@projectToolbarConfigPath]

        when '.json5'
          require 'json5/lib/require'
          projConfig = require @projectToolbarConfigPath
          delete require.cache[@projectToolbarConfigPath]

        when '.cson'
          CSON = require 'cson'
          projConfig = CSON.requireCSONFile @projectToolbarConfigPath

      for i of projConfig
        config.push projConfig[i]

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

  storeProject: ->
    editor = atom.workspace.getActiveTextEditor()
    if editor and editor?.buffer?.file?.getParent()?.path? isnt @currentProject
      if editor?.buffer?.file?.getParent()?.path?
        @currentProject = editor.buffer.file.getParent().path
      return true
    else
      return false

  storeGrammar: ->
    editor = atom.workspace.getActiveTextEditor()
    @currentGrammar = editor?.getGrammar()?.name.toLowerCase()

  didChangeGrammar: ->
    editor = atom.workspace.getActiveTextEditor()
    editor and editor.getGrammar().name.toLowerCase() isnt @currentGrammar

  removeButtons: ->
    @toolBar.removeItems() if @toolBar?

  deactivate: ->
    @watcherList.forEach (watcher) ->
      watcher.close()
    @watcherList = null
    @subscriptions.dispose()
    @subscriptions = null
    @removeButtons()

  serialize: ->

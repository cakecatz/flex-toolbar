path = require 'path'
fs = require 'fs-plus'
chokidar = require 'chokidar'
globToRegexp = require 'glob-to-regexp'
{ CompositeDisposable } = require 'atom'
changeCase = require 'change-case'

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
      default: atom.getConfigDirPath()
    reloadToolBarWhenEditConfigFile:
      type: 'boolean'
      default: true
    reloadToolBarNotification:
      type: 'boolean'
      default: true
    useBrowserPlusWhenItIsActive:
      type: 'boolean'
      default: false

  reloadToolBarNotification: ->
    atom.config.get 'flex-tool-bar.reloadToolBarNotification'

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
    @registerEvents()
    @registerWatch()
    @registerProjectWatch()

    @reloadToolbar(false)

  resolveConfigPath: ->
    @configFilePath = atom.config.get 'flex-tool-bar.toolBarConfigurationFilePath'

    # If configFilePath is a folder, check for `toolbar.(json|cson|json5|js|coffee)` file
    unless fs.isFileSync(@configFilePath)
      @configFilePath = fs.resolve @configFilePath, 'toolbar', ['cson', 'json5', 'json', 'js', 'coffee']

    return true if @configFilePath

    unless @configFilePath
      @configFilePath = path.join atom.getConfigDirPath(), 'toolbar.cson'
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
        atom.notifications.addInfo 'We created a Tool Bar config file for you...', {
          detail: @configFilePath
          dismissable: true
          buttons: [{
            text: 'Edit Config'
            onDidClick: => atom.workspace.open @configFilePath
          }]
        }
        return true
      catch err
        @configFilePath = null
        atom.notifications.addError 'Something went wrong creating the Tool Bar config file! Please restart Atom to try again.', {
          detail: err.stack
          dismissable: true
        }
        console.error err
        return false

  resolveProjectConfigPath: ->
    @projectToolbarConfigPath = null
    editor = atom.workspace.getActivePaneItem()
    file = editor?.buffer?.file or editor?.file

    if file?.getParent()?.path?
      for pathToCheck in atom.project.getPaths()
        if file.getParent().path.includes(pathToCheck)
          @projectToolbarConfigPath = fs.resolve pathToCheck, 'toolbar', ['cson', 'json5', 'json', 'js', 'coffee']

    if @projectToolbarConfigPath is @configFilePath
      @projectToolbarConfigPath = null

    return true if @projectToolbarConfigPath

  registerCommand: ->
    @subscriptions.add atom.commands.add 'atom-workspace',
      'flex-tool-bar:edit-config-file': =>
        atom.workspace.open @configFilePath if @configFilePath

  registerEvents: ->
    @subscriptions.add atom.packages.onDidActivateInitialPackages  =>
      @reloadToolbar()

      @subscriptions.add atom.packages.onDidActivatePackage =>
        @reloadToolbar()

      @subscriptions.add atom.packages.onDidDeactivatePackage =>
        @reloadToolbar()

    @subscriptions.add atom.workspace.onDidChangeActivePaneItem (item) =>

      if @storeProject()
        @storeGrammar()
        @resolveProjectConfigPath()
        @registerProjectWatch()
        @reloadToolbar()
      else if @storeGrammar()
        @reloadToolbar()


  registerWatch: ->
    if atom.config.get('flex-tool-bar.reloadToolBarWhenEditConfigFile')
      watcher = chokidar.watch @configFilePath
        .on 'change', =>
          @reloadToolbar(@reloadToolBarNotification())
      @watcherList.push watcher

  registerProjectWatch: ->
    if @projectToolbarConfigPath and @watchList.indexOf(@projectToolbarConfigPath) < 0
      @watchList.push @projectToolbarConfigPath
      watcher = chokidar.watch @projectToolbarConfigPath
        .on 'change', (event, filename) =>
          @reloadToolbar(@reloadToolBarNotification())
      @watcherList.push watcher

  registerTypes: ->
    typeFiles = fs.listSync path.join __dirname, '../types'
    typeFiles.forEach (typeFile) =>
      typeName = path.basename typeFile, '.coffee'
      @buttonTypes[typeName] = require typeFile

  consumeToolBar: (toolBar) ->
    @toolBar = toolBar 'flex-toolBar'
    @reloadToolbar()

  getToolbarView: ->
    # This is an undocumented API that moved in tool-bar@1.1.0
    @toolBar.toolBarView || @toolBar.toolBar

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
      atom.notifications.addError "Could not load your toolbar from `#{fs.tildify(@configFilePath)}`", dismissable: true
      throw error

  fixToolBarHeight: ->
    @getToolbarView().element.style.height = "#{@getToolbarView().element.offsetHeight}px"

  unfixToolBarHeight: ->
    @getToolbarView().element.style.height = null

  addButtons: (toolBarButtons) ->
    if toolBarButtons?
      devMode = atom.inDevMode()
      for btn in toolBarButtons

        if ( btn.hide? && @condition(btn.hide) ) or ( btn.show? && !@condition(btn.show) )
          continue

        continue if btn.mode and btn.mode is 'dev' and not devMode

        button = @buttonTypes[btn.type](@toolBar, btn) if @buttonTypes[btn.type]

        button.element.classList.add "tool-bar-mode-#{btn.mode}" if btn.mode

        if btn.style?
          for propName, v of btn.style
            button.element.style[changeCase.camelCase(propName)] = v

        if btn.className?
          ary = btn.className.split ","
          for val in ary
            button.element.classList.add val.trim()

        if ( btn.disable? && @condition(btn.disable) ) or ( btn.enable? && !@condition(btn.enable) )
          button.setEnabled false

  removeCache: (filePath) ->
    delete require.cache[filePath]

    if snapshotResult?.customRequire?.cache?
      relativeFilePath = path.relative("#{process.cwd()}#{path.sep}resources#{path.sep}app#{path.sep}static", filePath)
      if process.platform is 'win32'
        relativeFilePath = relativeFilePath.replace(/\\/g, '/')
      delete snapshotResult.customRequire.cache[relativeFilePath]

  loadConfig: ->
    ext = path.extname @configFilePath

    switch ext
      when '.js', '.coffee'
        config = require(@configFilePath)
        @removeCache(@configFilePath)

      when '.json'
        config = require @configFilePath
        @removeCache(@configFilePath)

      when '.json5'
        require 'json5/lib/require'
        config = require @configFilePath
        @removeCache(@configFilePath)

      when '.cson'
        CSON = require 'cson'
        config = CSON.requireCSONFile @configFilePath
        @removeCache(@configFilePath)

    if @projectToolbarConfigPath
      ext = path.extname @projectToolbarConfigPath

      switch ext
        when '.js', '.coffee'
          projConfig = require(@projectToolbarConfigPath)
          @removeCache(@projectToolbarConfigPath)

        when '.json'
          projConfig = require @projectToolbarConfigPath
          @removeCache(@projectToolbarConfigPath)

        when '.json5'
          require 'json5/lib/require'
          projConfig = require @projectToolbarConfigPath
          @removeCache(@projectToolbarConfigPath)

        when '.cson'
          CSON = require 'cson'
          projConfig = CSON.requireCSONFile @projectToolbarConfigPath
          @removeCache(@projectToolbarConfigPath)

      for i of projConfig
        config.push projConfig[i]

    return config

  loopThrough: (items, func) ->
    items = [items] if not Array.isArray items
    for item in items
      return true if func(item)

    return false

  condition: (conditions) ->
    return @loopThrough conditions, (condition) =>

      if typeof condition is 'string'
        return true if @grammarCondition(condition)

      else

        if condition.grammar?
          return true if @loopThrough(condition.grammar, @grammarCondition.bind(this))

        if condition.pattern?
          return true if @loopThrough(condition.pattern, @patternCondition.bind(this))

        if condition.package?
          return true if @loopThrough(condition.package, @packageCondition.bind(this))

  grammarCondition: (condition) ->
    filePath = atom.workspace.getActivePaneItem()?.getPath?()
    result = false
    reverse = false
    if /^!/.test condition
      condition = condition.replace '!', ''
      reverse = true

    if /^[^\/]+\.(.*?)$/.test condition
      result = true if filePath isnt undefined and filePath.match(condition)?.length > 0
    else
      result = true if @currentGrammar? and @currentGrammar.includes condition.toLowerCase()

    result = !result if reverse

    result

  patternCondition: (condition) ->
    filePath = atom.workspace.getActivePaneItem()?.getPath?()
    result = false

    if filePath isnt undefined
      result = globToRegexp(condition, extended: true).test filePath

    result

  packageCondition: (condition) ->
    result = false
    reverse = false
    if /^!/.test condition
      condition = condition.replace '!', ''
      reverse = true

    result = true if atom.packages.isPackageActive(condition)
    result = !result if reverse

    result

  storeProject: ->
    editor = atom.workspace.getActivePaneItem()
    file = editor?.buffer?.file or editor?.file
    project = file?.getParent?().path

    if project isnt @currentProject
      @currentProject = project or null
      return true
    else
      return false

  storeGrammar: ->
    editor = atom.workspace.getActivePaneItem()
    grammar = editor?.getGrammar?().name.toLowerCase()

    if grammar isnt @currentGrammar
      @currentGrammar = grammar or null
      return true
    else
      return false

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

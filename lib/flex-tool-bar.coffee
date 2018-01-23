path = require 'path'
util = require 'util'
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
  functionConditions: []
  functionPoll: null
  pollTimeout: 0
  reloadToolBarNotification: false

  config:
    persistentProjectToolBar:
      description: 'Project tool bar will stay when focus is moved away from a project file'
      type: 'boolean'
      default: false
    reloadToolBarNotification:
      type: 'boolean'
      default: true
    reloadToolBarWhenEditConfigFile:
      type: 'boolean'
      default: true
    toolBarConfigurationFilePath:
      type: 'string'
      default: atom.getConfigDirPath()
    toolBarProjectConfigurationFilePath:
      type: 'string'
      default: '.'
    useBrowserPlusWhenItIsActive:
      type: 'boolean'
      default: false
    pollFunctionConditionsToReloadWhenChanged:
      type: 'integer'
      description: 'set to 0 to stop polling'
      default: 300

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
    @observeConfig()

    @reloadToolbar(false)

  pollFunctions: ->
    if @functionConditions.length > 0 and @pollTimeout > 0
      @functionPoll = setTimeout =>
        reload = false
        editor = atom.workspace.getActivePaneItem()

        for condition in @functionConditions
          try
            if condition.value isnt !!condition.func(editor)
              reload = true
              break
          catch err
            buttons = [{
              text: 'Edit Config'
              onDidClick: => atom.workspace.open @configFilePath
            }]
            if @projectToolbarConfigPath?
              buttons.push [{
                text: 'Edit Project Config'
                onDidClick: => atom.workspace.open @projectToolbarConfigPath
              }]
            atom.notifications.addError 'Invalid toolbar config', {
              detail: err.stack or err.toString()
              dismissable: true
              buttons: buttons
            }
            return

        if reload
          @reloadToolbar()
        else
          @pollFunctions()
      , @pollTimeout

  observeConfig: ->
    atom.config.observe 'flex-tool-bar.pollFunctionConditionsToReloadWhenChanged', (value) =>
      clearTimeout @functionPoll
      @pollTimeout = value
      @pollFunctions()

    atom.config.observe 'flex-tool-bar.reloadToolBarNotification', (value) =>
      @reloadToolBarNotification = value

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
    persistent = atom.config.get 'flex-tool-bar.persistentProjectToolBar'
    @projectToolbarConfigPath = null unless persistent
    relativeProjectConfigPath = atom.config.get 'flex-tool-bar.toolBarProjectConfigurationFilePath'
    editor = atom.workspace.getActivePaneItem()
    file = editor?.buffer?.file or editor?.file

    if file?.getParent()?.path?
      for pathToCheck in atom.project.getPaths()
        if file.getParent().path.includes(pathToCheck)
          pathToCheck = path.join pathToCheck, relativeProjectConfigPath
          if fs.isFileSync(pathToCheck)
            @projectToolbarConfigPath = pathToCheck
          else
            found = fs.resolve pathToCheck, 'toolbar', ['cson', 'json5', 'json', 'js', 'coffee']
            @projectToolbarConfigPath = found if found

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
          @reloadToolbar(@reloadToolBarNotification)
      @watcherList.push watcher

  registerProjectWatch: ->
    if @projectToolbarConfigPath and @watchList.indexOf(@projectToolbarConfigPath) < 0
      @watchList.push @projectToolbarConfigPath
      watcher = chokidar.watch @projectToolbarConfigPath
        .on 'change', (event, filename) =>
          @reloadToolbar(@reloadToolBarNotification)
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
    @getToolbarView()?.element?.style.height = "#{@getToolbarView().element.offsetHeight}px"

  unfixToolBarHeight: ->
    @getToolbarView()?.element?.style.height = null

  addButtons: (toolBarButtons) ->
    if toolBarButtons?
      devMode = atom.inDevMode()
      clearTimeout @functionPoll
      @functionConditions = []
      btnErrors = []
      for btn in toolBarButtons

        try
          hide = ( btn.hide? && @checkConditions(btn.hide) ) or ( btn.show? && !@checkConditions(btn.show) )
          disable = ( btn.disable? && @checkConditions(btn.disable) ) or ( btn.enable? && !@checkConditions(btn.enable) )
        catch err
          btnErrors.push "#{err.message or err.toString()}\n#{util.inspect(btn, depth: 4)}"
          continue

        continue if hide
        continue if btn.mode? and btn.mode is 'dev' and not devMode

        button = @buttonTypes[btn.type](@toolBar, btn) if @buttonTypes[btn.type]

        button.element.classList.add "tool-bar-mode-#{btn.mode}" if btn.mode

        if btn.style?
          for propName, v of btn.style
            button.element.style[changeCase.camelCase(propName)] = v

        if btn.className?
          ary = btn.className.split ","
          for val in ary
            button.element.classList.add val.trim()

        button.setEnabled(false) if disable

      if btnErrors.length > 0
        buttons = [{
          text: 'Edit Config'
          onDidClick: => atom.workspace.open @configFilePath
        }]
        if @projectToolbarConfigPath?
          buttons.push [{
            text: 'Edit Project Config'
            onDidClick: => atom.workspace.open @projectToolbarConfigPath
          }]
        atom.notifications.addError 'Invalid toolbar config', {
          detail: btnErrors.join '\n\n'
          dismissable: true
          buttons: buttons
        }

      @pollFunctions()

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
    ret = false
    for item in items
      ret = func(item) or ret

    return !!ret

  checkConditions: (conditions) ->
    return @loopThrough conditions, (condition) =>
      ret = false

      if typeof condition is 'string'
        ret = @grammarCondition(condition) or ret

      else if typeof condition is 'function'
        ret = @functionCondition(condition) or ret

      else

        if condition.function?
          ret = @loopThrough(condition.function, @functionCondition.bind(this)) or ret

        if condition.grammar?
          ret = @loopThrough(condition.grammar, @grammarCondition.bind(this)) or ret

        if condition.pattern?
          ret = @loopThrough(condition.pattern, @patternCondition.bind(this)) or ret

        if condition.package?
          ret = @loopThrough(condition.package, @packageCondition.bind(this)) or ret

      return ret

  functionCondition: (condition) ->
    value = !!condition(atom.workspace.getActivePaneItem())

    @functionConditions.push
      func: condition
      value: value

    value

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
    project = file?.getParent?()?.path

    if project isnt @currentProject
      @currentProject = project or null
      return true
    else
      return false

  storeGrammar: ->
    editor = atom.workspace.getActivePaneItem()
    grammar = editor?.getGrammar?()?.name.toLowerCase()

    if grammar isnt @currentGrammar
      @currentGrammar = grammar or null
      return true
    else
      return false

  removeButtons: ->
    @toolBar?.removeItems()

  deactivate: ->
    @watcherList.forEach (watcher) ->
      watcher.close()
    @watcherList = null
    @subscriptions.dispose()
    @subscriptions = null
    @removeButtons()
    @toolBar = null

  serialize: ->

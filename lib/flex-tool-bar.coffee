path = require 'path'
util = require 'util'
fs = require 'fs-plus'
chokidar = require 'chokidar'
globToRegexp = require 'glob-to-regexp'
{ CompositeDisposable } = require 'atom'
changeCase = require 'change-case'

VALID_EXTENSIONS = [
  'cson'
  'coffee'
  'json5'
  'json'
  'js'
]

module.exports =
  toolBar: null
  configFilePath: null
  currentGrammar: null
  currentProject: null
  buttonTypes: []
  configWatcher: null
  projectConfigwatcher: null
  functionConditions: []
  functionPoll: null

  config:
    persistentProjectToolBar:
      description: 'Project tool bar will stay when focus is moved away from a project file'
      type: 'boolean'
      default: false
    pollFunctionConditionsToReloadWhenChanged:
      type: 'integer'
      description: 'set to 0 to stop polling'
      default: 300
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

  activate: ->
    @subscriptions = new CompositeDisposable

    require('atom-package-deps').install('flex-tool-bar')

    @storeProject()
    @storeGrammar()
    @registerTypes()
    @registerCommands()
    @registerEvents()
    @observeConfig()

    @resolveConfigPath()
    @registerWatch()

    @resolveProjectConfigPath()
    @registerProjectWatch()

    @reloadToolbar()

  pollFunctions: ->
    pollTimeout = atom.config.get 'flex-tool-bar.pollFunctionConditionsToReloadWhenChanged'
    if @functionConditions.length > 0 and pollTimeout > 0
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
            if @projectConfigFilePath?
              buttons.push [{
                text: 'Edit Project Config'
                onDidClick: => atom.workspace.open @projectConfigFilePath
              }]
            atom.notifications.addError 'Invalid toolbar config', {
              detail: err.stack ? err.toString()
              dismissable: true
              buttons: buttons
            }
            return

        if reload
          @reloadToolbar()
        else
          @pollFunctions()
      , pollTimeout

  observeConfig: ->
    @subscriptions.add atom.config.onDidChange 'flex-tool-bar.persistentProjectToolBar', ({newValue}) =>
      @unregisterProjectWatch()
      if @resolveProjectConfigPath(undefined, newValue)
        @registerProjectWatch()
      @reloadToolbar()

    @subscriptions.add atom.config.onDidChange 'flex-tool-bar.pollFunctionConditionsToReloadWhenChanged', ({oldValue, newValue}) =>
      clearTimeout @functionPoll
      if newValue isnt 0
        @pollFunctions()

    @subscriptions.add atom.config.onDidChange 'flex-tool-bar.reloadToolBarWhenEditConfigFile', ({newValue}) =>
      @unregisterWatch()
      @unregisterProjectWatch()
      if newValue
        @registerWatch(true)
        @registerProjectWatch(true)

    @subscriptions.add atom.config.onDidChange 'flex-tool-bar.toolBarConfigurationFilePath', ({newValue}) =>
      @unregisterWatch()
      if @resolveConfigPath(newValue, false)
        @registerWatch()
      @reloadToolbar()

    @subscriptions.add atom.config.onDidChange 'flex-tool-bar.toolBarProjectConfigurationFilePath', ({newValue}) =>
      @unregisterProjectWatch()
      if @resolveProjectConfigPath(newValue)
        @registerProjectWatch()
      @reloadToolbar()

  resolveConfigPath: (configFilePath = atom.config.get('flex-tool-bar.toolBarConfigurationFilePath'), createIfNotFound = true) ->
    configPath = configFilePath
    unless fs.isFileSync(configPath)
      configPath = fs.resolve configPath, 'toolbar', VALID_EXTENSIONS

    if configPath
      @configFilePath = configPath
      return true
    else if createIfNotFound
      configPath = configFilePath
      exists = fs.existsSync(configPath)
      if (exists and fs.isDirectorySync(configPath)) or (not exists and path.extname(configPath) not in VALID_EXTENSIONS)
        configPath = path.resolve configPath, 'toolbar.cson'
      if @createConfig configPath
        @configFilePath = configPath
        return true

    return false

  createConfig: (configPath) ->
    try
      ext = path.extname configPath
      if ext not in VALID_EXTENSIONS
        throw new Error "'#{ext}' is not a valid extension. Please us one of ['#{VALID_EXTENSIONS.join("','")}']"
      fs.writeFileSync configPath, fs.readFileSync path.resolve(__dirname, "./default/toolbar#{ext}")
      atom.notifications.addInfo 'We created a Tool Bar config file for you...', {
        detail: configPath
        dismissable: true
        buttons: [{
          text: 'Edit Config'
          onDidClick: -> atom.workspace.open configPath
        }]
      }
      return true
    catch err
      notification = atom.notifications.addError 'Something went wrong creating the Tool Bar config file!', {
        detail: "#{configPath}\n\n#{err.stack ? err.toString()}"
        dismissable: true
        buttons: [{
          text: 'Reload Toolbar'
          onDidClick: =>
            notification.dismiss()
            @resolveConfigPath()
            @registerWatch()
            @reloadToolbar()
        }]
      }
      console.error err
      return false

  resolveProjectConfigPath: (
    configFilePath = atom.config.get('flex-tool-bar.toolBarProjectConfigurationFilePath'),
    persistent = atom.config.get('flex-tool-bar.persistentProjectToolBar')) ->
      @projectConfigFilePath = null unless persistent and fs.isFileSync(@projectConfigFilePath)
      editor = atom.workspace.getActivePaneItem()
      file = editor?.buffer?.file or editor?.file

      if file?.getParent()?.path?
        for pathToCheck in atom.project.getPaths()
          if file.getParent().path.includes(pathToCheck)
            pathToCheck = path.join pathToCheck, configFilePath
            if fs.isFileSync(pathToCheck)
              @projectConfigFilePath = pathToCheck
            else
              found = fs.resolve pathToCheck, 'toolbar', VALID_EXTENSIONS
              @projectConfigFilePath = found if found

      if @projectConfigFilePath is @configFilePath
        @projectConfigFilePath = null

      return !!@projectConfigFilePath

  registerCommands: ->
    @subscriptions.add atom.commands.add 'atom-workspace',
      'flex-tool-bar:edit-config-file': =>
        atom.workspace.open @configFilePath if @configFilePath

    @subscriptions.add atom.commands.add 'atom-workspace',
      'flex-tool-bar:edit-project-config-file': =>
        atom.workspace.open @projectConfigFilePath if @projectConfigFilePath

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
        @unregisterProjectWatch()
        @resolveProjectConfigPath()
        @registerProjectWatch()
        @reloadToolbar()
      else if @storeGrammar()
        @reloadToolbar()

  unregisterWatch: ->
    @configWatcher?.close()
    @configWatcher = null

  registerWatch: (shouldWatch = atom.config.get('flex-tool-bar.reloadToolBarWhenEditConfigFile')) ->
    return unless shouldWatch and @configFilePath

    @configWatcher?.close()
    @configWatcher = chokidar.watch @configFilePath
      .on 'change', =>
        @reloadToolbar(atom.config.get 'flex-tool-bar.reloadToolBarNotification')

  unregisterProjectWatch: ->
    @projectConfigWatcher?.close()
    @projectConfigWatcher = null

  registerProjectWatch: (shouldWatch = atom.config.get('flex-tool-bar.reloadToolBarWhenEditConfigFile')) ->
    return unless shouldWatch and @projectConfigFilePath

    @projectConfigWatcher?.close()
    @projectConfigWatcher = chokidar.watch @projectConfigFilePath
      .on 'change', =>
        @reloadToolbar(atom.config.get 'flex-tool-bar.reloadToolBarNotification')

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
    clearTimeout @functionPoll
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
        if @projectConfigFilePath?
          buttons.push [{
            text: 'Edit Project Config'
            onDidClick: => atom.workspace.open @projectConfigFilePath
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
    config = [
      {
        type: "function"
        icon: "tools"
        callback: ->
          @resolveConfigPath()
          @registerWatch()
          @reloadToolbar()
        tooltip: "Create Global Tool Bar Config"
      }
    ]

    if @configFilePath
      ext = path.extname @configFilePath
      @removeCache(@configFilePath)

      switch ext
        when '.js', '.json', '.coffee'
          config = require @configFilePath

        when '.json5'
          require 'json5/lib/require'
          config = require @configFilePath

        when '.cson'
          CSON = require 'cson'
          config = CSON.requireCSONFile @configFilePath

    if @projectConfigFilePath
      ext = path.extname @projectConfigFilePath
      @removeCache(@projectConfigFilePath)

      switch ext
        when '.js', '.json', '.coffee'
          projConfig = require @projectConfigFilePath

        when '.json5'
          require 'json5/lib/require'
          projConfig = require @projectConfigFilePath

        when '.cson'
          CSON = require 'cson'
          projConfig = CSON.requireCSONFile @projectConfigFilePath

      config = config.concat projConfig

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
    @unregisterWatch()
    @unregisterProjectWatch()
    @subscriptions.dispose()
    @subscriptions = null
    @removeButtons()
    @toolBar = null
    clearTimeout @functionPoll
    @functionPoll = null

  serialize: ->

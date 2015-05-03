shell = require 'shell'
path = require 'path'

module.exports =
  toolBar: null

  config:
    toolBarConfigurationJsonPath:
      type: 'string'
      default: path.join process.env.ATOM_HOME, 'toolbar.json'
    showConfigButton:
      type: 'boolean'
      default: true
    reloadToolBarWhenEditJson:
      type: 'boolean'
      default: true

  activate: ->
    @subscriptions = atom.commands.add 'atom-workspace',
      'flex-tool-bar:edit-config-file': ->
        atom.workspace.open atom.config.get('flex-tool-bar.toolBarConfigurationJsonPath')
    if atom.config.get('flex-tool-bar.reloadToolBarWhenEditJson')
      watch = require 'node-watch'
      watch atom.config.get('flex-tool-bar.toolBarConfigurationJsonPath'), =>
        @reloadToolbar()

  consumeToolBar: (toolBar) ->
    @toolBar = toolBar 'flex-toolBar'
    @reloadToolbar true

  reloadToolbar: (init) ->
    try
      toolBarButtons = require atom.config.get('flex-tool-bar.toolBarConfigurationJsonPath')
      delete require.cache[atom.config.get('flex-tool-bar.toolBarConfigurationJsonPath')]
      # Remove and add buttons after successful JSON parse
      @removeButtons()
      @addButtons toolBarButtons
      if atom.config.get('flex-tool-bar.showConfigButton')
        @toolBar.addButton
          icon: 'gear'
          callback: 'flex-tool-bar:edit-config-file'
          tooltip: 'Edit ToolBar'
        @toolBar.addSpacer()
      atom.notifications.addSuccess 'The tool-bar was successfully updated.' if not init
    catch error
      atom.notifications.addError 'Your `toolbar.json` is **not valid JSON**!' if not init
      console.debug 'JSON is not valid'

  addButtons: (toolBarButtons) ->
    if toolBarButtons?
      devMode = atom.inDevMode()
      for btn in toolBarButtons
        continue if btn.mode and btn.mode is 'dev' and not devMode
        switch btn.type
          when 'button'
            button = @toolBar_addButton btn
          when 'spacer'
            button = @toolBar.addSpacer priority: btn.priority
          when 'url'
            button = @toolBar.addButton
              icon: btn.icon
              callback: (url) ->
                shell.openExternal url
              tooltip: btn.tooltip
              iconset: btn.iconset
              data: btn.url
              priority: btn.priority
        button.addClass "tool-bar-mode-#{btn.mode}" if btn.mode

  toolBar_addButton: (btn) ->
    if Array.isArray btn.callback
      @toolBar.addButton
        icon: btn.icon
        callback: (callbacks) ->
          for callback in callbacks
            atom.commands.dispatch document.activeElement, callback
        tooltip: btn.tooltip
        iconset: btn.iconset
        priority: btn.priority
        data: btn.callback
    else
      @toolBar.addButton
        icon: btn.icon
        callback: btn.callback
        tooltip: btn.tooltip
        iconset: btn.iconset
        priority: btn.priority

  removeButtons: ->
    @toolBar.removeItems()

  deactivate: ->
    @subscriptions.dispose()
    @removeButtons()

  serialize: ->

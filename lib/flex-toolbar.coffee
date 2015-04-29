shell = require 'shell'
path = require 'path'

module.exports =
  toolbar: null

  config:
    toolbarConfigurationJsonPath:
      type: 'string'
      default: path.join process.env.ATOM_HOME, 'toolbar.json'
    showConfigButton:
      type: 'boolean'
      default: true
    reloadToolbarWhenEditJson:
      type: 'boolean'
      default: true

  activate: ->
    @subscriptions = atom.commands.add 'atom-workspace',
      'flex-toolbar:edit-config-file': ->
        atom.workspace.open atom.config.get('flex-toolbar.toolbarConfigurationJsonPath')
    if atom.config.get('flex-toolbar.reloadToolbarWhenEditJson')
      watch = require 'node-watch'
      watch atom.config.get('flex-toolbar.toolbarConfigurationJsonPath'), =>
        @reloadToolbar()

  consumeToolBar: (toolbar) ->
    @toolbar = toolbar 'flex-toolbar'
    @reloadToolbar()

  reloadToolbar: () ->
    try
      toolbarButtons = require atom.config.get('flex-toolbar.toolbarConfigurationJsonPath')
      delete require.cache[atom.config.get('flex-toolbar.toolbarConfigurationJsonPath')]
      # Remove and add buttons after successful JSON parse
      @removeButtons()
      @addButtons toolbarButtons
      if atom.config.get('flex-toolbar.showConfigButton')
        @toolbar.addButton
          icon: 'gear'
          callback: 'flex-toolbar:edit-config-file'
          tooltip: 'Edit toolbar'
    catch error
      console.debug 'JSON is not valid'

  addButtons: (toolbarButtons) ->
    if toolbarButtons?
      devMode = atom.inDevMode()
      for btn in toolbarButtons
        continue if btn.mode and btn.mode is 'dev' and not devMode
        switch btn.type
          when 'button'
            button = @toolbar_addButton btn
          when 'spacer'
            button = @toolbar.addSpacer()
          when 'url'
            button = @toolbar.addButton
              icon: btn.icon
              callback: (url) ->
                shell.openExternal url
              tooltip: btn.tooltip
              iconset: btn.iconset
              data: btn.url
        button.addClass "tool-bar-mode-#{btn.mode}" if btn.mode

  toolbar_addButton: (btn) ->
    if Array.isArray btn.callback
      @toolbar.addButton
        icon: btn.icon
        callback: (callbacks) ->
          for callback in callbacks
            atom.commands.dispatch document.activeElement, callback
        tooltip: btn.tooltip
        iconset: btn.iconset
    else
      @toolbar.addButton
        icon: btn.icon
        callback: btn.callback
        tooltip: btn.tooltip
        iconset: btn.iconset

  removeButtons: ->
    @toolbar.removeItems()

  deactivate: ->
    @subscriptions.dispose()
    @removeButtons()

  serialize: ->

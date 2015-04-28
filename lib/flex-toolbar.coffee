rootDir = require('../index').getPackageRootDir()
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
    @toolbar = toolbar
    @reloadToolbar()

  reloadToolbar: () ->
    try
      toolbarButtons = require atom.config.get('flex-toolbar.toolbarConfigurationJsonPath')
      delete require.cache[atom.config.get('flex-toolbar.toolbarConfigurationJsonPath')]
      # Remove and add buttons after successful JSON parse
      @removeButtons()
      @addButtons toolbarButtons
      if atom.config.get('flex-toolbar.showConfigButton')
        @toolbar.addButton 'gear', 'flex-toolbar:edit-config-file', 'Edit toolbar'
    catch error
      console.debug 'JSON is not valid'

  addButtons: (toolbarButtons) ->
    if toolbarButtons?
      devMode = atom.inDevMode()
      for btn in toolbarButtons
        continue if btn.mode and btn.mode is 'dev' and not devMode
        switch btn.type
          when 'button'
            if Array.isArray btn.callback
              button = @toolbar.addButton btn.icon, (callbacks) ->
                for callback in callbacks
                  atom.commands.dispatch document.activeElement, callback
              , btn.tooltip, btn.iconset, btn.callback
            else
              button = @toolbar.addButton btn.icon, btn.callback, btn.tooltip, btn.iconset
          when 'spacer'
            button = @toolbar.addSpacer()
          when 'url'
            button = @toolbar.addButton btn.icon, (url) ->
              shell.openExternal(url)
            , btn.tooltip, btn.iconset, btn.url
        button.addClass 'tool-bar-mode-' + btn.mode if btn.mode

  removeButtons: ->
    {$} = require 'space-pen'
    $(".tool-bar").empty()

  deactivate: ->
    @subscriptions.dispose()
    @removeButtons()

  serialize: ->

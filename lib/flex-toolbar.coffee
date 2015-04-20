rootDir = require('../index').getPackageRootDir()
shell = require 'shell'
path = require 'path'

module.exports =
  urlholder: ''

  toolbar: null

  config:
    toolbarConfigurationJsonPath:
      type: 'string'
      default: path.join rootDir, 'toolbar.json'
    showConfigButton:
      type: 'boolean'
      default: true

  activate: (state) ->

    if atom.packages.isPackageLoaded('toolbar')
      @initToolbar()
    else
      apd = require('atom-package-dependencies')
      apd.install =>
        @initToolbar()

    atom.commands.add 'atom-workspace',
      'flex-toolbar:edit-config-file': ->
        atom.workspace.open atom.config.get('flex-toolbar.toolbarConfigurationJsonPath')

  initToolbar: () ->
    atom.packages.activatePackage('toolbar')
      .then (pkg) =>
        @toolbar = pkg.mainModule

        try
          toolbarButtons = require atom.config.get('flex-toolbar.toolbarConfigurationJsonPath')
        catch error
          console.log 'toolbar.json is not found.'

        @appendButtons(toolbarButtons)

        if atom.config.get('flex-toolbar.showConfigButton')
          @toolbar.appendButton 'gear', 'flex-toolbar:edit-config-file', 'Edit toolbar', ''

  appendButtons: (toolbarButtons) ->

    if toolbarButtons?
      for btn in toolbarButtons
        switch btn.type
          when 'button'
            @toolbar.appendButton btn.icon, btn.callback, btn.tooltip, btn.iconset
          when 'spacer'
            @toolbar.appendSpacer()
          when 'url'
            @urlholder = btn.url
            @toolbar.appendButton btn.icon, =>
              shell.openExternal(@urlholder)
            , btn.tooltip, btn.iconset

  deactivate: ->

  serialize: ->

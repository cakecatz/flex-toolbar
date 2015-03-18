rootDir = require('../index').getPackageRootDir()
shell = require 'shell'

module.exports =
  urlholder: ''

  toolbarButtons: {}

  config:
    toolbarConfigurationJsonPath:
      type: 'string'
      default: rootDir + '/toolbar.json'

  activate: (state) ->
    atom.packages.activatePackage('toolbar')
      .then (pkg) =>

        @toolbar = pkg.mainModule
        @toolbarButtons = require atom.config.get('flex-toolbar.toolbarConfigurationJsonPath')

        for btn in @toolbarButtons
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

    atom.commands.add 'atom-workspace',
      'flex-toolbar: Edit my config file': ->
        atom.workspace.open atom.config.get('flex-toolbar.toolbarConfigurationJsonPath')

  deactivate: ->

  serialize: ->


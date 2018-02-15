{shell} = require 'electron'
UrlReplace = require '../lib/url-replace'

module.exports = (toolBar, button) ->
  options =
    icon: button.icon
    iconset: button.iconset
    tooltip: button.tooltip
    priority: button.priority or 45
    data: button.url
    callback: (url) ->
      urlReplace = new UrlReplace()
      url = urlReplace.replace url
      if url.startsWith('atom://')
        atom.workspace.open url
      else if atom.config.get 'flex-tool-bar.useBrowserPlusWhenItIsActive'
        if atom.packages.isPackageActive 'browser-plus'
          atom.workspace.open url, split:'right'
        else
          warning = 'Package browser-plus is not active. Using default browser instead!'
          options = detail: 'Use apm install browser-plus to install the needed package.'
          atom.notifications.addWarning warning, options
          shell.openExternal url
      else
        shell.openExternal url

  return toolBar.addButton options

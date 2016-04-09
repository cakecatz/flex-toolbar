UrlReplace = require '../lib/url-replace'

module.exports = (toolBar, button) ->
  return toolBar.addButton
    icon: button.icon
    callback: (url) ->
      urlReplace = new UrlReplace()
      url = urlReplace.replace url
      atom.workspace.open (url)
    tooltip: button.tooltip
    iconset: button.iconset
    data: button.url
    priority: button.priority or 45

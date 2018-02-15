module.exports = (toolBar, button) ->
  options =
    icon: button.icon
    iconset: button.iconset
    tooltip: button.tooltip
    priority: button.priority or 45
    callback: button.callback

  return toolBar.addButton options

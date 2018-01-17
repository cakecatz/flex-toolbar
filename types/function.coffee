module.exports = (toolBar, button) ->
  options =
    icon: button.icon
    tooltip: button.tooltip
    iconset: button.iconset
    priority: button.priority or 45
    data: button.callback
    callback: (data, target) ->
      data(target)

  return toolBar.addButton options

module.exports = (toolBar, button) ->
  options =
    icon: button.icon
    iconset: button.iconset
    tooltip: button.tooltip
    priority: button.priority or 45
    data: button.callback
    callback: (data, target) ->
      data.call(this, target)

  return toolBar.addButton options

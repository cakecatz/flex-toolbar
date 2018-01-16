module.exports = (toolBar, button) ->
  options =
    icon: button.icon
    text: button.text
    html: button.html
    tooltip: button.tooltip
    iconset: button.iconset
    priority: button.priority or 45
    callback: button.callback

  return toolBar.addButton options

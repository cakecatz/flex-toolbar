module.exports = (toolBar, button) ->
  options =
    icon: button.icon
    tooltip: button.tooltip
    iconset: button.iconset
    priority: button.priority or 45

  if Array.isArray button.callback
    options.callback = (_, target) ->
      for callback in button.callback
        atom.commands.dispatch target, callback
  else
    options.callback = button.callback

  return toolBar.addButton options

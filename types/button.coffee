module.exports = (toolBar, button) ->
  options =
    icon: button.icon
    tooltip: button.tooltip
    iconset: button.iconset
    priority: button.priority

  if Array.isArray button.callback
    options.callback = (callbacks, target) ->
      for callback in callbacks
        atom.commands.dispatch target, callback
  else
    options.callback = button.callback

  return toolBar.addButton options

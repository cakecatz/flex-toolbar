module.exports = (toolBar, button) ->
  return toolBar.addSpacer priority: button.priority or 45

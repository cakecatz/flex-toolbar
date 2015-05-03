# Flex Tool Bar

### Easily Customizable ToolBar for Atom

This is plugin of [tool-bar](https://atom.io/packages/tool-bar).

You can config your toolbar with JSON file and can create link button for open web site.

![screenshot](https://raw.githubusercontent.com/cakecatz/flex-toolbar/docs/screenshot.png)

If you edit your config file, type `Flex Toolbar: Edit my config file` on command palette.

### Configuration

FlexToolBar have 3 types.
`button`, `url` and `spacer`.

`button` is default button of toolbar.  
You can set actions like `application:new-file`.

`url` is open web page on default browser.  
If you want see this feature, check this [screencast](http://quick.as/b5vafe4g).

`spacer` is separator of buttons.

### Sample Code
    [
      {
        "type": "url",
        "icon": "octoface",
        "url": "http://github.com",
        "tooltip": "Github Page",
        "iconset": ""
      },
      {
        "type": "spacer"
      },
      {
        "type": "button",
        "icon": "document",
        "callback": "application:new-file",
        "tooltip": "New File",
        "iconset": "ion",
        "mode": "dev"
      },
      {
        "type": "button",
        "icon": "columns",
        "iconset": "fa",
        "callback": ["pane:split-right", "pane:split-right"]
      }
    ]

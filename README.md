# Flex Tool Bar

### Easily Customizable Toolbar for Atom

This is a plugin for the [Atom Tool Bar](https://atom.io/packages/tool-bar) package.

You can configure your toolbar buttons with a JSON file to perform specific actions in Atom or to open web sites in your default browser.

![screenshot](https://raw.githubusercontent.com/cakecatz/flex-toolbar/docs/screenshot.png)

To edit your config file, type `Flex Toolbar: Edit my config file` in the Atom command palette.

### Configuration

**Flex Tool Bar** has three "types" you can configure:
`button`, `url` and `spacer`.

- `button` creates default buttons for your toolbar.

    You can use it to set actions like `application:new-file`.

- `url` creates buttons pointing to specific web pages.

    Use this to open any web site, such as your GitHub notifications, in your default browser. See this feature in action in this [screencast](http://quick.as/b5vafe4g).

- `spacer` adds separators between toolbar buttons.

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

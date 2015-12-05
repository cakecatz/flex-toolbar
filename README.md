# Flex Tool Bar

[![Build Status](https://travis-ci.org/cakecatz/flex-toolbar.svg)](https://travis-ci.org/cakecatz/flex-toolbar)

### Easily Customizable Toolbar for Atom

This is a plugin for the [Atom Tool Bar](https://atom.io/packages/tool-bar) package.

You can configure your toolbar buttons with a `CSON`, `JSON`, `JSON5` file to perform specific actions in Atom or to open web sites in your default browser.

![screenshot](https://raw.githubusercontent.com/cakecatz/flex-toolbar/docs/screenshot_cson.png)

To edit your config file, type `Flex Tool Bar: Edit Config File` in the Atom command palette.

### Configuration

**Flex Tool Bar** has three "types" you can configure:
`button`, `url` and `spacer`.

- `button` creates default buttons for your toolbar.

    You can use it to set actions like `application:new-file`.

- `url` creates buttons pointing to specific web pages.

    Use this to open any web site, such as your GitHub notifications, in your default browser. See this feature in action in this [screencast](http://quick.as/b5vafe4g).
    
    If you have the package [browser-plus](https://atom.io/packages/browser-plus) installed, you can use its in Atom browser to open your links. Just check the box in flex-toolbars settings.

- `spacer` adds separators between toolbar buttons.

### Features

- multiple callback
- button style
- hide, disable button when specific grammar

### Button style

Can use CSS Property.

    style: {
      color: "red"
      background: "green"
      border: "1px solid blue"
    }

### Multiple callback

    callback: ["callback1", "callback2"]

### Hide(Show), Disable(Enable) button

You can hide or disable button when specific grammar.
If you set like this,

    disable: "coffee"

Will disable button when opened CoffeeScript file.

Of course, can set Array to value.

    disable: [
      "json"
      "less"
    ]

You can use `!` :laughing:

    hide: "!Markdown"

This will hide button when opened any file except Markdown.

    show: "Markdown"

This is same above.


### Sample Code

    [
      {
        type: "url"
        icon: "octoface"
        url: "http://github.com"
        tooltip: "Github Page"
      }
      {
        type: "spacer"
      }
      {
        type: "button"
        icon: "document"
        callback: "application:new-file"
        tooltip: "New File"
        iconset: "ion"
        mode: "dev"
      }
      {
        type: "button"
        icon: "columns"
        iconset: "fa"
        callback: ["pane:split-right", "pane:split-right"]
      }
      {
        type: "button"
        icon: "circuit-board"
        callback: "git-diff:toggle-diff-list"
        style:
          color: "#FA4F28"
      }
      {
        type: "button"
        icon: "markdown"
        callback: "markdown-preview:toggle"
        disable: "!markdown"
      }
    ]

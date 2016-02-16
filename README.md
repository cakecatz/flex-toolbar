# Flex Tool Bar

[![Build Status](https://travis-ci.org/cakecatz/flex-toolbar.svg)](https://travis-ci.org/cakecatz/flex-toolbar)

## About

This is a plugin for
the [Atom Tool Bar](https://atom.io/packages/tool-bar) package.

You can configure your toolbar buttons with a `CSON`, `JSON`, `JSON5` file
to perform specific actions in Atom
or to open web sites in your default browser.

![screenshot](https://raw.githubusercontent.com/cakecatz/flex-toolbar/docs/screenshot_cson.png)

To edit your config file,
type `Flex Tool Bar: Edit Config File` in the Atom command palette.

## Configuration

**Flex Tool Bar** has three `type`s you can configure:
`button`, `url` and `spacer`.

-   `button` creates default buttons for your toolbar.

    You can use it to set actions like `application:new-file`.

-   `url` creates buttons pointing to specific web pages.

    Use this to open any web site, such as your GitHub notifications,
    in your default browser. See this feature in action in this [screencast](http://quick.as/b5vafe4g).

    If you have the package [browser-plus](https://atom.io/packages/browser-plus)
    installed, you can use it to open your links.
    Just check the box in flex-toolbar's settings.

-   `spacer` adds separators between toolbar buttons.

### Features

-   multiple callback
-   button style
-   hide/disable a button in certain cases

### Button style

Can use CSS Property.

```coffeescript
style: {
  color: "red"
  background: "green"
  border: "1px solid blue"
}
```

### Multiple callback

```coffeescript
callback: ["callback1", "callback2"]
```

### Hide(Show), Disable(Enable) button

You can hide or disable buttons when a certain grammar is
used in the active file or a specified file is matched.

If you set `disable` (`show`, `hide` or `enable`) this way:

```coffeescript
disable: "coffee"
```

It will disable the button if a CoffeeScript file is open.

You can also look for a specific file using [globs](https://tr.im/glob):

```coffeescript
show: {
  pattern: 'gulpfile.js'
  options: {
    maxDepth: 2
  }
}
```

The package uses [tree-match-sync](https://github.com/boredz/tree-match-sync)
that depends on the `tree` command, [install it](https://github.com/boredz/tree-match-sync#installation)
before using this feature.

The options are explained [here](https://github.com/isaacs/minimatch#options)
and it has an extra field: `maxDepth`,
it translates to `tree`'s option `-L`, you should always set it.

Of course, you can set it as an array.

```coffeescript
disable: [
  "json"
  "less"
]
```

You can use `!` :laughing:

```coffeescript
hide: "!Markdown"
```

This will hide button when opened any file except Markdown.

```coffeescript
show: "Markdown"
```

This is same above.

### Example

```coffeescript
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
```

See more examples on [Wiki](https://github.com/cakecatz/flex-toolbar/wiki) ✨

## Authors

| [![Ryo Narita][cakecatz avator]](https://github.com/cakecatz) | [![Jeroen van Warmerdam][jerone avator]](https://github.com/jerone) |
| :-----------------------------------------------------------: | :-----------------------------------------------------------------: |
| [Ryo Narita](https://github.com/cakecatz)                     | [Jeroen van Warmerdam](https://github.com/jerone)                   |

## License

MIT © [Ryo Narita](https://github.com/cakecatz)

[cakecatz avator]: https://avatars.githubusercontent.com/u/6136383?v=3&s=100
[jerone avator]: https://avatars.githubusercontent.com/u/55841?v=3&s=100

# Flex Tool Bar

[![Build Status](https://travis-ci.org/cakecatz/flex-toolbar.svg?branch=master)](https://travis-ci.org/cakecatz/flex-toolbar)

## About

This is a plugin for
the [Atom Tool Bar](https://atom.io/packages/tool-bar) package.

You can configure your toolbar buttons with a `CSON`, `JSON`, `JSON5`, `js`, `coffee` file
to perform specific actions in Atom
or to open web sites in your default browser.

![screenshot](https://raw.githubusercontent.com/cakecatz/flex-toolbar/docs/screenshot_cson.png)

To edit your config file,
type `Flex Tool Bar: Edit Config File` in the Atom command palette.

## Configuration

**Flex Tool Bar** has four `type`s you can configure:
`button`, `url`, `function` and `spacer`.

-   `button` creates default buttons for your toolbar.

    You can use it to set actions like `application:new-file`.

-   `url` creates buttons pointing to specific web pages.

    Use this to open any web site, such as your GitHub notifications,
    in your default browser. See this feature in action in this [screencast](http://quick.as/b5vafe4g).

    If you have the package [browser-plus](https://atom.io/packages/browser-plus)
    installed, you can use it to open your links.
    Just check the box in Flex Tool Bar's settings.

    Also Atom URI are allowed. For example
    `atom://config/packages/flex-tool-bar` will open Flex Tool Bar's settings.

    You can also create dynamic urls with the following placeholders:

    -   `{repo-name}` The repo name for the current repo
    -   `{repo-owner}` The GitHub user for the current repo
    -   `{atom-version}` The current version of Atom

    e.g. `https://github.com/{repo-owner}/{repo-name}`

-   `function` creates buttons that can call a function with the previous target as a parameter

    This requires the config file to be a `.js` or `.coffee` file that exports the array of buttons

-   `spacer` adds separators between toolbar buttons.

### Features

-   multiple callbacks
-   function callback
-   button icons
-   inline button styles
-   add class(s) to buttons
-   hide/disable a button in certain cases

### Button Icon

The default iconset is [Octicons](https://octicons.github.com/) (Atom's flavor).

Example:
```coffeescript
{
  type: "button"
  tooltip: "New File"
  callback: "application:new-file"
  icon: "file-add"
}
```

But you can specify the following iconsets:
-   [Ionicons](http://ionicons.com) (`ion`)
-   [FontAwesome](http://fortawesome.github.io/Font-Awesome) (`fa`)
-   [Foundation](http://zurb.com/playground/foundation-icon-fonts-3) (`fi`)
-   [IcoMoon](https://icomoon.io) (`icomoon`)
-   [Devicon](http://devicon.fr) (`devicon`)
-   [MaterialDesignIcons](https://materialdesignicons.com/) (`mdi`)

Example:
```coffeescript
{
  type: "button"
  tooltip: "Save File"
  callback: "core:save"
  icon: "floppy-o"
  iconset: "fa"
}
```

### Button style

You can use CSS styles per button.

```coffeescript
style: {
  color: "red"
  background: "green"
  border: "1px solid blue"
}
```

### Button class

Using a comma separated list you can add your own class names to buttons.
This is great if you want to take advantage of native styles like Font Awesome
or if you have your own styles you prefer to keep in a stylesheet.

```coffeescript
className: "fa-rotate-90, custom-class"
```

### Multiple callback

```coffeescript
callback: ["callback1", "callback2"]
```

### Function callback

```coffeescript
callback: target ->
  console.log target
```

### Hide(Show), Disable(Enable) button

You can hide or disable buttons when a certain grammar is
used in the active file, a specified file is matched, or
a package is active.

> If you don't know what language to use, see this [issue](https://github.com/cakecatz/flex-toolbar/issues/105).

If you set `disable` (`show`, `hide` or `enable`) this way:

```coffeescript
disable: {
  grammar: "coffee"
}
```

It will disable the button if a CoffeeScript file is open.

You can also look for a specific file using [globs](https://tr.im/glob):

```coffeescript
show: {
  pattern: "*.js"
}
```

You can also look for a specific package using:

```coffeescript
show: {
  package: "context-git"
}
```

Of course, you can set it as an array.

```coffeescript
disable: {
  grammar: [
    "json"
    "less"
  ]
}
```

You can use `!` in grammar and package :laughing:

```coffeescript
hide: {
  grammar: "!Markdown"
}
```

This will hide button when opened any file except Markdown.

```coffeescript
show: {
  grammar: "Markdown"
}
```

This is same above.

### Examples

#### .cson Example

```coffeescript
[
  {
    type: "url"
    icon: "octoface"
    url: "https://github.com/"
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
  {
    type: "button"
    icon: "sitemap"
    iconset: "fa"
    className: "fa-rotate-180"
    tooltip: "This is just an example it does nothing"
  }
]
```

#### .coffee Example

```coffeescript
module.exports = [
  {
    type: "function"
    icon: "bug"
    callback: (target) ->
      console.dir target
    tooltip: "Debug Target"
  }
  {
    type: "spacer"
  }
  {
    type: "url"
    icon: "octoface"
    url: "https://github.com/"
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
  {
    type: "button"
    icon: "sitemap"
    iconset: "fa"
    className: "fa-rotate-180"
    tooltip: "This is just an example it does nothing"
  }
]
```

### Per Project Configuration

If you want buttons that are only for a specific project. Create a toolbar configuration file at the root of your project directory that is listed in the Atom Tree View. All buttons added to the project toolbar will append to the global toolbar buttons.

See more examples on [Wiki](https://github.com/cakecatz/flex-toolbar/wiki) ✨

## Authors

| [![Ryo Narita][cakecatz avator]](https://github.com/cakecatz) | [![Jeroen van Warmerdam][jerone avator]](https://github.com/jerone) |
| :-----------------------------------------------------------: | :-----------------------------------------------------------------: |
| [Ryo Narita](https://github.com/cakecatz)                     | [Jeroen van Warmerdam](https://github.com/jerone)                   |

## License

MIT © [Ryo Narita](https://github.com/cakecatz)

[cakecatz avator]: https://avatars.githubusercontent.com/u/6136383?v=3&s=100
[jerone avator]: https://avatars.githubusercontent.com/u/55841?v=3&s=100

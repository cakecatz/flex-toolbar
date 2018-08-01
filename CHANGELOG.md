## [vNext](https://github.com/cakecatz/flex-toolbar/compare/v2.1.2...master)

## [v2.1.2](https://github.com/cakecatz/flex-toolbar/compare/v2.1.1...v2.1.2) - 2018-08-01
-   Add an error when config is not an array [#153](https://github.com/cakecatz/flex-toolbar/issues/153)

## [v2.1.1](https://github.com/cakecatz/flex-toolbar/compare/v2.1.0...v2.1.1) - 2018-07-09
-   Use Atom's PathWatcher to watch the config files [#151](https://github.com/cakecatz/flex-toolbar/pull/151) (by [@UziTech](https://github.com/UziTech))

## [v2.1.0](https://github.com/cakecatz/flex-toolbar/compare/v2.0.2...v2.1.0) - 2018-05-30
-   Add hover style [#149](https://github.com/cakecatz/flex-toolbar/pull/149) (by [@paradoXp](https://github.com/paradoXp))

## [v2.0.2](https://github.com/cakecatz/flex-toolbar/compare/v2.0.1...v2.0.2) - 2018-04-11
-   Fix deactivate flex-tool-bar [#146](https://github.com/cakecatz/flex-toolbar/issues/146)

## [v2.0.1](https://github.com/cakecatz/flex-toolbar/compare/v2.0.0...v2.0.1) - 2018-04-11
-   Change default config file back to `.cson` since examples are written using CSON
-   Remove text/html hack since [tool-bar v1.1.7](https://github.com/suda/tool-bar/releases/tag/v1.1.7) allows text/html

## [v2.0.0](https://github.com/cakecatz/flex-toolbar/compare/v1.1.0...v2.0.0) - 2018-03-16
-   BREAKING: Get active item from workplace center [#139](https://github.com/cakecatz/flex-toolbar/pull/139) (by [@UziTech](https://github.com/UziTech))

## [v1.1.0](https://github.com/cakecatz/flex-toolbar/compare/v1.0.0...v1.1.0) - 2018-03-08
-   Fix `snapshotResult is not defined` [#137](https://github.com/cakecatz/flex-toolbar/issues/137)
-   Text and HTML options [#125](https://github.com/cakecatz/flex-toolbar/pull/125) (by [@UziTech](https://github.com/UziTech))
-   Use project repo for url if no active item repo is found

## [v1.0.0](https://github.com/cakecatz/flex-toolbar/compare/v0.16.0...v1.0.0) - 2018-03-07
-   Change default config file to `.js`
-   Move to JavaScript [#135](https://github.com/cakecatz/flex-toolbar/pull/135) (by [@UziTech](https://github.com/UziTech))
-   Detect grammar change [#136](https://github.com/cakecatz/flex-toolbar/issues/136)
-   Add file type [#72](https://github.com/cakecatz/flex-toolbar/pull/72) (by [@ryanjbonnell](https://github.com/ryanjbonnell))

## [v0.16.0](https://github.com/cakecatz/flex-toolbar/compare/v0.15.1...v0.16.0) - 2018-02-15
-   Add setting conditions
-   Fix when project toolbar config is deleted
-   Add function conditions [#127](https://github.com/cakecatz/flex-toolbar/pull/127) (by [@UziTech](https://github.com/UziTech))
-   Observe changes to settings and better error handling

## [v0.15.1](https://github.com/cakecatz/flex-toolbar/compare/v0.15.0...v0.15.1) - 2018-01-22
-   Fix getGrammar() is undefined [#131](https://github.com/cakecatz/flex-toolbar/issues/131)

## [v0.15.0](https://github.com/cakecatz/flex-toolbar/compare/v0.14.0...v0.15.0) - 2018-01-19
-   Add project config path setting [#128](https://github.com/cakecatz/flex-toolbar/pull/128) (by [@malnvenshorn](https://github.com/malnvenshorn))
-   Add persistent project tool bar setting [#129](https://github.com/cakecatz/flex-toolbar/pull/129) (by [@UziTech](https://github.com/UziTech))

## [v0.14.0](https://github.com/cakecatz/flex-toolbar/compare/v0.13.2...v0.14.0) - 2018-01-17
-   Add package conditions [#126](https://github.com/cakecatz/flex-toolbar/pull/126) (by [@UziTech](https://github.com/UziTech))

## [v0.13.2](https://github.com/cakecatz/flex-toolbar/compare/v0.13.1...v0.13.2) - 2018-01-16
-   Fix pattern matching images [#73](https://github.com/cakecatz/flex-toolbar/issues/73)

## [v0.13.1](https://github.com/cakecatz/flex-toolbar/compare/v0.13.0...v0.13.1) - 2018-01-16
-   Fix file pattern matching [#57](https://github.com/cakecatz/flex-toolbar/issues/57)

## [v0.13.0](https://github.com/cakecatz/flex-toolbar/compare/v0.12.0...v0.13.0) - 2018-01-15
-   Fix updating toolbar on config change [PR #114](https://github.com/cakecatz/flex-toolbar/pull/114) (by [@UziTech](https://github.com/UziTech))
-   Add information about icon sets to the README [PR #199](https://github.com/cakecatz/flex-toolbar/pull/119) (by [@TJProgrammer](https://github.com/TJProgrammer))
-   Add option to disable reload notification [PR #101](https://github.com/cakecatz/flex-toolbar/pull/101) (by [@danielbayley](https://github.com/danielbayley))

## [v0.12.0](https://github.com/cakecatz/flex-toolbar/compare/v0.11.0...v0.12.0) - 2017-03-11
-   Fix loading when using `tool-bar@1.1.0`. [PR #98](https://github.com/cakecatz/flex-toolbar/pull/98) (by [@zertosh](https://github.com/zertosh))
-   Use `atom.configDirPath` instead of `ATOM_HOME`. [PR #97](https://github.com/cakecatz/flex-toolbar/pull/97) (by [@danielbayley](https://github.com/danielbayley))
-   Add ability to add user defined class' to a button. [PR #95](https://github.com/cakecatz/flex-toolbar/pull/95) (by [@blizzardengle](https://github.com/blizzardengle))
-   Add Function callback. [PR #86](https://github.com/cakecatz/flex-toolbar/pull/85) (by [@UziTech](https://github.com/UziTech))
-   Add `.js` and `.coffee` config file types. [PR #86](https://github.com/cakecatz/flex-toolbar/pull/85) (by [@UziTech](https://github.com/UziTech))

## 0.4.4
-   Fixed resolveConfigPath not searching for toolbar.json (by Andrew Douglas)

## 0.4.3
-   Change default config file type

## 0.4.2
-   Fixed bugs

## 0.4.0
-   Support CSON, JSON5 config file
-   ADD show, enable property

## 0.3.0
-   Add style property
-   Add hide, disable property
-   Fixed callback target

## 0.2.1
-   Fixed callback target

## 0.2.0
-   Use ToolBar Services API (by Jeroen van Warmerdam)
-   Notifications on toolbar edit (by Jeroen van Warmerdam)
-   Rename flex-toolbar to flex-tool-bar

## 0.1.10
-   Fixed many open edit toolbar tab
-   Fixed be removed toolbar.json
-   Add dev mode (by Jeroen van Warmerdam)

## 0.1.9
-   Fixed diactivating behaviour
-   Fixed removing buttons from toolbar with new toolbar theme (by Jeroen van Warmerdam)

## 0.1.8
-   Fix some bugs

## 0.1.7
-   Fix some bugs (by Jeroen van Warmerdam)

## 0.1.6
-   Reload toolbar when edit toolbar.json

## 0.1.5
-   Fix default path for Windows users (by Jeroen van Warmerdam)
-   Refactoring (by Jeroen van Warmerdam)

## 0.1.4
-   Loading icon to be faster

## 0.1.3
-   Auto install toolbar when not installed
-   Added button for edit toolbar.json

## 0.0.1 - First Release

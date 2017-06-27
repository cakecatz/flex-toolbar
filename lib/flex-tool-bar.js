'use babel'

const path = require('path')
const fs = require('fs-extra')
const CSON = require('cson')
const chokidar = require('chokidar')
const changeCase = require('change-case')

const configKey = 'flex-tool-bar'

class FlexToolBar {
  config = null;
  configPath = null;
  watcher = null;
  items = [];

  async setupToolBar () {
    this.config = await this.loadToolBarConfigure()

    if (this.config) {
      this.watchConfig()
      this.addItems()
    }
  }

  watchConfig () {
    this.watcher = chokidar
      .watch(this.configPath)
      .on('change', async (e, path) => {
        this.config = await this.loadToolBarConfigure()
        if (this.config) {
          this.updateItems()
        }
      })
  }

  resolveConfigPath () {
    this.configPath = atom.config.get(
      `${configKey}.toolBarConfigurationFilePath`
    )

    if (!this.configPath) {
      this.configPath = path.join(atom.configDirPath, 'toolbar.cson')
      return 'default'
    }
  }

  copyDefaultConfigFile () {
    return new Promise(resolve => {
      fs.access(this.configPath, fs.constants.F_OK, (err, stats) => {
        if (err) {
          // file not exists
          fs.copySync(path.join(__dirname, './toolbar.cson'), this.configPath)
        }
        resolve()
      })
    })
  }

  async loadToolBarConfigure () {
    this.loading = true

    this.resolveConfigPath()
    await this.copyDefaultConfigFile()

    this.loading = false
    return CSON.requireFile(this.configPath)
  }

  addToolBar (toolBar) {
    this.toolBar = toolBar
    this.setupToolBar()
  }

  addItems () {
    this.items = this.config
      .map(prop => ({
        prop,
        element: this.addItem(prop)
      }))
      .filter(a => a)
  }

  addItem (prop) {
    switch (prop.type) {
      case 'spacer':
        return this.addSpacer(prop)
      case 'url':
        return this.addUrl(prop)
      case 'button':
      default:
        return this.addButton(prop)
    }
  }

  addButton (prop) {
    const button = this.toolBar.addButton({
      icon: prop.icon,
      tooltip: prop.tooltip,
      iconset: prop.iconset,
      priority: prop.priority || 45,
      callback: prop.callback
    })

    if (prop.style) {
      Object.keys(prop.style).forEach(key => {
        button.element.style[changeCase.camelCase(key)] = prop.style[key]
      })
    }

    if (prop.className) {
      prop.className.split(',').forEach(className => {
        button.element.classList.add(className.trim())
      })
    }
    return button
  }

  addSpacer (prop) {
    return this.toolBar.addSpacer({
      priority: prop.priority || 45
    })
  }

  addUrl (prop) {
    return this.toolBar.addButton({
      icon: prop.icon,
      callback: url => {
        console.log(url)
      },
      tooltip: prop.tooltip,
      iconset: prop.iconset,
      data: prop.url,
      priority: prop.priority || 45
    })
  }

  updateItems () {
    this.toolBar.removeItems()
    this.addItems()
  }

  destroy () {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }
}

export default FlexToolBar

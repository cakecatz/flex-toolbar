'use babel'

const {CompositeDisposable} = require('event-kit')
const FlexToolBar = require('./flex-tool-bar')

export const config = {}

class FlexToolBarPackage {
  flexToolBar = null;
  toolBar = null;
  disposables = null;

  activate () {
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.commands.add('atom-workspace', {
        'flex-tool-bar:edit-config': () => {
          if (this.flexToolBar) {
            atom.workspace.open(this.flexToolBar.configPath)
          }
        }
      })
    )

    require('atom-package-deps').install('flex-tool-bar', true).then(() => {
      this.flexToolBar = new FlexToolBar()
      if (this.toolBar) {
        this.flexToolBar.addToolBar(this.toolBar)
      }
    })
  }

  deactivate () {
    if (this.flexToolBar) {
      this.flexToolBar.destroy()
    }
  }

  consumeToolBar (getToolBar) {
    this.toolBar = getToolBar('flex-tool-bar')
    if (this.flexToolBar) {
      this.flexToolBar.addToolBar(this.toolBar)
    }
  }

  serialize () {}
}

module.exports = FlexToolBarPackage
//
// export default {
//   flexToolBar: null,
//   toolBar: null,
//
//   activate (state = {}) {
//     require('atom-package-deps').install('flex-tool-bar', true).then(() => {
//       this.flexToolBar = new FlexToolBar(state)
//       if (this.toolBar) {
//         this.flexToolBar.addToolBar(this.toolBar)
//       }
//     })
//   },
//
//   deactivate () {
//     this.flexToolBar.destroy()
//     this.flexToolBar = null
//     this.toolBar.removeItems()
//     this.toolBar = null
//   },
//
//   consumeToolBar (getToolBar) {
//     this.toolBar = getToolBar('flex-tool-bar')
//     if (this.flexToolBar) {
//       this.flexToolBar.addToolBar(this.toolBar)
//     }
//   },
//
//   serialize () {
//     return this.flexToolBar.serialize()
//   }
// }

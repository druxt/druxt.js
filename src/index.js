import { resolve } from 'path'

export { DruxtMenu } from './menu.js'

import DruxtMenuComponent from './component.js'
export { DruxtMenuComponent }

export { DruxtMenuStore } from './store.js'

export default function (moduleOptions = {}) {
  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-menu.js',
    options: moduleOptions
  })

  // Add Vuex plugin.
  // @TODO - Ensure Vuex store is available.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/store.js'),
    fileName: 'store/druxt-menu.js',
    options: moduleOptions
  })
}

import { resolve } from 'path'

import DruxtBreadcrumb from './component.js'
export { DruxtBreadcrumb }

export default function (moduleOptions = {}) {
  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-breadcrumb.js',
    moduleOptions
  })
}


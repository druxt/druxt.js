import { resolve } from 'path'

export * from './components'

import * as DruxtBreadcrumbComponents from './components'
export { DruxtBreadcrumbComponents }

export default function (moduleOptions = {}) {
  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-breadcrumb.js',
    moduleOptions
  })
}


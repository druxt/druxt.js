import { resolve } from 'path'

export * from './components'

import * as DruxtBreadcrumbComponents from './components'
export { DruxtBreadcrumbComponents }

export default function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }
  const options = this.options.druxt

  options.breadcrumb = {
    home: true,

    ...options.breadcrumb
  }

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-breadcrumb.js',
    options
  })
}


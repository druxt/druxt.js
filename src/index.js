import { resolve } from 'path'

import * as DruxtViewsComponents from './components'
export { DruxtViewsComponents }

export { DruxtViewsViewMixin } from './mixins/view'

export * from './components'

export default function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }
  const options = this.options.druxt

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-views.js',
    options
  })
}

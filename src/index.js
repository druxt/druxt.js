import { resolve } from 'path'

import DruxtEntityComponent from './components/DruxtEntity.vue'
export { DruxtEntityComponent }

import { DruxtEntityMixin } from './mixins/entity.js'
export { DruxtEntityMixin }

import DruxtFieldComponent from './components/DruxtField.vue'
export { DruxtFieldComponent }

import { DruxtFieldMixin } from './mixins/field.js'
export { DruxtFieldMixin }

export default function (moduleOptions = {}) {
  // Use root level Druxt options.
  if (typeof this.options === 'undefined' || !this.options.druxt) {
    throw new TypeError('Druxt settings missing.')
  }
  const options = this.options.druxt

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, '../nuxt/plugin.js'),
    fileName: 'druxt-entity.js',
    options
  })
}

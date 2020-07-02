import Vue from 'vue'

import { DruxtBlocksComponents } from 'druxt-blocks'

Vue.use({
  install: function (Vue) {
    if (Vue._druxt_blocks_installed) return
    Vue._druxt_blocks_installed = true

    // Register components.
    for (const component in DruxtBlocksComponents) {
      Vue.component(component, DruxtBlocksComponents[component])
    }
  }
})

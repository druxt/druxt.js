import Vue from 'vue'

import { DruxtEntityComponents } from 'druxt-entity'

Vue.use({
  install: function (Vue) {
    if (Vue._druxt_entity_installed) return
    Vue._druxt_entity_installed = true

    // Register components.
    for (const component in DruxtEntityComponents) {
      Vue.component(component, DruxtEntityComponents[component])
    }
  }
})

import Vue from 'vue'
import { DruxtEntityComponent, DruxtFieldComponent } from 'druxt-entity'

Vue.use({
  install: function (Vue) {
    if (Vue._druxt_entity_installed) return
    Vue._druxt_entity_installed = true

    // Register components.
    Vue.component('DruxtEntity', DruxtEntityComponent)
    Vue.component('DruxtField', DruxtFieldComponent)
  }
})

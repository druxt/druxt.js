import Vue from 'vue'
import { DruxtComponent } from 'druxt'

// Install the Druxt Vue.js component.
Vue.use({
  install: function (Vue) {
    if (Vue._druxt_installed) return
    Vue._druxt_installed = true

    // Register component.
    Vue.component(DruxtComponent.name, DruxtComponent)
  }
})

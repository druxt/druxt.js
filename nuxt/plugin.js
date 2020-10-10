import Vue from 'vue'
import { Druxt, DruxtWrapper } from 'druxt'

// Install the Druxt Vue.js component.
Vue.use({
  install: function (Vue) {
    if (Vue._druxt_installed) return
    Vue._druxt_installed = true

    // Register components.
    Vue.component(Druxt.name, Druxt)
    Vue.component(DruxtWrapper.name, DruxtWrapper)
  }
})

import Vue from 'vue'
import { DruxtSite } from 'druxt-site'

// Install the DruxtSite Vue.js component.
Vue.use({
  install: function (Vue) {
    if (Vue._druxt_site_installed) return
    Vue._druxt_site_installed = true

    // Register component.
    Vue.component(DruxtSite.name, DruxtSite)
  }
})

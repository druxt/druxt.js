import Vue from 'vue'

import { DruxtView } from 'druxt-views'

Vue.use({
  install: function (Vue) {
    if (Vue._druxt_views_installed) return
    Vue._druxt_views_installed = true

    // Register components.
    Vue.component('druxt-view', DruxtView)
    Vue.component('druxt-views', DruxtView)
  }
})

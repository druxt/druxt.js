import Vue from 'vue'

import { DruxtBreadcrumbComponents } from 'druxt-breadcrumb'

Vue.use({
  install: function (Vue) {
    if (Vue._druxt_breadcrumb_installed) return
    Vue._druxt_breadcrumb_installed = true

    // Register components.
    for (const component in DruxtBreadcrumbComponents) {
      Vue.component(component, DruxtBreadcrumbComponents[component])
    }
  }
})

export default (context, inject) => {
  const options = <%= JSON.stringify(options.breadcrumb) %>

  inject('druxtBreadcrumb', { options })
}

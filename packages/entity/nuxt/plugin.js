import Vue from 'vue'

import { DruxtEntityComponents } from 'druxt-entity'

Vue.use({
  install: function (Vue) {
    if (Vue._druxt_entity_installed) return
    Vue._druxt_entity_installed = true

    // Tree shake field components.
    const fields = <%= (((options.entity || {}).components || {}).fields === false ? false : true) %>

    // Register components.
    for (const component in DruxtEntityComponents) {
      if (!fields && component.startsWith('DruxtField') && component !== 'DruxtField') {
        continue
      }
      Vue.component(component, DruxtEntityComponents[component])
    }
  }
})

export default (context, inject) => {
  const options = {
    query: {
      // @todo Set default to true in 1.0.0.
      schema: <%= (((options.entity || {}).query || {}).schema || false) %>,
      fields: [<%= (((options.entity || {}).query || {}).fields || []).map((s) => `"${s}"`).join(', ') %>],
    }
  }

  inject('druxtEntity', { options })
}

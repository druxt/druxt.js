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

export default (context, inject) => {
  const options = {
    entity: {
      suggestions: []
    }
  }

  <% if (options.entity && Array.isArray(options.entity.suggestions) && options.entity.suggestions.length > 0) { %>
    <% for (let suggestion of options.entity.suggestions) { %>
      <% if (suggestion.type && suggestion.value) { %>
  options.entity.suggestions.push({
    type: '<%= suggestion.type %>',
    value: <%= typeof suggestion.value === 'string' ? `'${suggestion.value}'` : suggestion.value %>
  })
      <% } %>
    <% } %>
  <% } %>

  inject('druxtEntity', { options })
}

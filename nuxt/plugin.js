import Vue from 'vue'
import { Druxt, DruxtClass, DruxtWrapper } from 'druxt'

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

export default (context, inject) => {
  const baseUrl = '<%= options.baseUrl %>'
  const options = {}

  <% if (options.endpoint) { %>
  options.endpoint = '<%= options.endpoint %>'
  <% } %>

  <% if (typeof options.axios === 'object') { %>
  // Axios settings.
  options.axios = <%= JSON.stringify(options.axios) %>
  <% } %>

  const druxt = new DruxtClass(baseUrl, options)
  inject('druxt', druxt)
}

import Vue from 'vue'
import { Druxt, DruxtClient, DruxtWrapper } from 'druxt'

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
  console.warn('[druxt] Axios instance settings are deprecated, use @nuxtjs/axios module configuration instead.')
  options.axios = <%= JSON.stringify(options.axios) %>
  <% } else { %>
  // Use the @nuxtjs/axios module Axios instance.
  options.axios = context.app.$axios
  <% } %>

  const druxt = new DruxtClient(baseUrl, options)
  inject('druxt', druxt)
}

import { DruxtClient } from 'druxt'

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

import { DruxtClient } from 'druxt'

export default ({ app }, inject) => {
  const options = <%= JSON.stringify(options) %>

  // Disable the proxy for server side requests.
  if (!process.client && (options.proxy || {}).api) {
    options.proxy.api = false
  }

  <% if (typeof options.axios === 'object') { %>
  // Axios settings.
  console.warn('[druxt] Axios instance settings are deprecated, use @nuxtjs/axios module configuration instead.')
  options.axios = <%= JSON.stringify(options.axios) %>
  <% } else { %>
  // Use the @nuxtjs/axios module Axios instance.
  options.axios = app.$axios
  <% } %>

  const druxt = new DruxtClient(options.baseUrl, options)
  druxt.settings = options
  inject('druxt', druxt)
}

import { DruxtClient } from 'druxt'

<% const { isNuxt2 } = options; delete options.isNuxt2 %>
<% if (typeof isNuxt2 === 'function' && isNuxt2()) { %>
// Druxt Plugin for Nuxt 2.
export default ({ app }, inject) => {
<% } else { %>
// Druxt Plugin for Nuxt 3.
export default defineNuxtPlugin((app) => {
<% } %>
  const options = <%= JSON.stringify(options) %>

  // Disable the proxy for server side requests.
  if (!process.client && options.proxy?.api) {
    options.proxy.api = false
  }

  <% if (typeof isNuxt2 === 'function' && isNuxt2()) { %>
  <% if (typeof options.axios === 'object') { %>
  // Axios settings.
  console.warn('[druxt] Axios instance settings are deprecated, use @nuxtjs/axios module configuration instead.')
  options.axios = <%= JSON.stringify(options.axios) %>
  <% } else { %>
  // Use the @nuxtjs/axios module Axios instance.
  options.axios = app.$axios
  <% } %>
  <% } %>

  const druxt = new DruxtClient(options.baseUrl, options)
  druxt.settings = options
<% if (typeof isNuxt2 === 'function' && isNuxt2()) { %>
  inject('druxt', druxt)
}
<% } else { %>
  return {
    provide: { druxt }
  }
})
<% } %>

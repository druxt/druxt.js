import { DruxtRouter } from 'druxt-router'

export default ({ app }, inject) => {
  const baseUrl = '<%= options.baseUrl %>'
  const options = {}

  <% if (options.endpoint) { %>
  options.endpoint = '<%= options.endpoint %>'
  <% } %>

  <% if ((options.proxy || {}).api) { %>
  if (process.client) {
    options.proxy = {
      api: <%= options.proxy.api %>
    }
  }
  <% } %>

  <% if (options.router && options.router.render) { %>
  // Render component.
  options.render = '<%= options.router.render %>'
  <% } %>

  <% if (typeof options.axios === 'object') { %>
  // Axios settings.
  options.axios = <%= JSON.stringify(options.axios) %>
  <% } else { %>
  // Use the @nuxtjs/axios module Axios instance.
  options.axios = app.$axios
  <% } %>

  const router = new DruxtRouter(baseUrl, options)
  inject('druxtRouter', () => router)
}

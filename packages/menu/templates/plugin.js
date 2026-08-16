import { DruxtMenu } from 'druxt-menu'

export default ({ app }, inject) => {
  const baseUrl = '<%= options.baseUrl %>'
  const options = {}

  <% if (options.endpoint) { %>
  options.endpoint = '<%= options.endpoint %>'
  <% } %>

  <% if (options.menu) { %>
  options.menu = <%= JSON.stringify(options.menu) %>
  <% } %>

  <% if (typeof options.axios === 'object') { %>
  // Axios settings.
  options.axios = <%= JSON.stringify(options.axios) %>
  <% } else { %>
  // Use the @nuxtjs/axios module Axios instance.
  options.axios = app.$axios
  <% } %>

  // Reuse the druxt module client if available.
  if (app.$druxt) {
    options.druxtClient = app.$druxt
  }

  const druxtMenu = new DruxtMenu(baseUrl, options)
  inject('druxtMenu', druxtMenu)
}

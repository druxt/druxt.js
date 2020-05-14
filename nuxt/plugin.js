import { DruxtRouter } from 'druxt-router'

export default (context, inject) => {
  const baseUrl = '<%= options.baseUrl %>'
  const options = {}

  <% if (typeof options.axios === 'object') { %>
  // Axios settings.
  options.axios = <%= JSON.stringify(options.axios) %>
  <% } %>

  const router = new DruxtRouter(baseUrl, options)
  inject('druxtRouter', () => router)
}

import { Druxt } from 'druxt'

export default (context, inject) => {
  const baseUrl = '<%= options.baseUrl %>'
  const options = {}

  <% if (options.endpoint) { %>
  options.endpoint = '<%= options.endpoint %>'
  <% } %>

  const druxt = new Druxt(baseUrl, options)
  inject('druxt', druxt)
}

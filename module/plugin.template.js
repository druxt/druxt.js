import DruxtRouter from '<%= options.importPath ? options.importPath : 'druxt-router' %>'

export default (context, inject) => {
  const baseUrl = '<%= options.baseUrl %>'
  const options = {}

  <% if (typeof options.schema !== 'undefined') { %>
  options.schema = <%= options.schema %>
  <% } %>

  const router = new DruxtRouter(baseUrl, options, context)
  inject('druxtRouter', () => router)
}

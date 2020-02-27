import DruxtRouter from '<%= options.importPath ? options.importPath : 'druxt-router' %>'
<% if (options.JSONAPIDeserializer) { %>import { Deserializer } from 'jsonapi-serializer'<% } %>

export default (context, inject) => {
  const baseUrl = '<%= options.baseUrl %>'
  const options = {}

  <% if (typeof options.schema !== 'undefined') { %>
  options.schema = <%= options.schema %>
  <% } %>

  <% if (options.JSONAPIDeserializer) { %>
  options.preprocessEntity = async resource => {
    const results = await new Deserializer({}).deserialize({ data: [resource.data.data ]})
    return results[0]
  }
  <% } %>

  const router = new DruxtRouter(baseUrl, options, context)
  inject('druxtRouter', () => router)
}

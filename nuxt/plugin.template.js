import DruxtRouter from '<%= options.importPath ? options.importPath : 'druxt-router' %>'
<% if (options.JSONAPIDeserializer) { %>import { Deserializer } from 'jsonapi-serializer'<% } %>

export default (context, inject) => {
  const baseUrl = '<%= options.baseUrl %>'
  const options = {}

  <% if (options.JSONAPIDeserializer) { %>
  // JSONAPIDeserialzer.
  options.preprocessEntity = async resource => {
    const options = <%= JSON.stringify(options.JSONAPIDeserializer) %>

    // Build map of relationships.
    for (const key in resource.data.data.relationships) {
      if (!resource.data.data.relationships[key].data) {
        continue
      }

      const data = Array.isArray(resource.data.data.relationships[key].data)
        ? resource.data.data.relationships[key].data
        : [resource.data.data.relationships[key].data]

        for (const relationship of data) {
          if (typeof options[relationship.type] !== 'undefined') {
            continue
          }

          options[relationship.type] = {
            valueForRelationship: relationship => relationship
          }
        }
    }

    const results = await new Deserializer(options).deserialize({ data: [resource.data.data ]})

    return results[0]
  }
  <% } %>

  const router = new DruxtRouter(baseUrl, options, context)
  inject('druxtRouter', () => router)
}

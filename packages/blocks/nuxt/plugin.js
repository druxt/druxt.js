export default (context, inject) => {
  const options = {}

  <% if (Array.isArray(((options.blocks || {}).query || {}).fields)) { %>
  options.query = {
    fields: [<%= options.blocks.query.fields.map((s) => `"${s}"`).join(', ') %>],
  }
  <% } %>

  inject('druxtBlocks', { options })
}

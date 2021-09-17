export default (context, inject) => {
  const options = {
    query: {
      // @todo Set default to true in 1.0.0.
      schema: <%= (((options.entity || {}).query || {}).schema || false) %>,
      fields: [<%= (((options.entity || {}).query || {}).fields || []).map((s) => `"${s}"`).join(', ') %>],
    }
  }

  inject('druxtEntity', { options })
}

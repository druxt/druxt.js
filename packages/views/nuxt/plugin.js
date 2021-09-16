export default (context, inject) => {
  const options = {
    query: {
      bundleFilter: <%= (((options.views || {}).query || {}).bundleFilter || false) %>,
      fields: [<%= (((options.views || {}).query || {}).fields || []).map((s) => `"${s}"`).join(', ') %>],
      resourceTypes: [<%= (((options.views || {}).query || {}).resourceTypes || []).map((s) => `"${s}"`).join(', ') %>],
    }
  }

  inject('druxtViews', { options })
}

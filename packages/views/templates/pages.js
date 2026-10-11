// The Views pages from `druxt.views.pages`, for DruxtViewsPage at runtime.
const pages = <%= JSON.stringify(options.pages || {}) %>

export default (context, inject) => {
  inject('druxtViewsPages', pages)
}

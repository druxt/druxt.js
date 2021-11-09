import { DruxtClient } from 'druxt'

export default (context, inject) => {
  const options = <%= JSON.stringify(options) %>

  // Disable the proxy for server side requests.
  if (!process.client && (options.proxy || {}).api) {
    options.proxy.api = false
  }

  const druxt = new DruxtClient(options.baseUrl, options)
  druxt.settings = options
  inject('druxt', druxt)
}

const baseUrl = process.env.BASE_URL || 'https://demo-api.druxtjs.org'
export default {
  target: 'static',
  generate: { routes: ['/'] },
  telemetry: true,
  buildModules: ['@nuxt/postcss8'],
  modules: ['druxt-site'],
  druxt: {
    // The baseUrl of the Druxt enabled Drupal JSON:API server.
    baseUrl,

    // Set the JSON:API endpoint, `/jsonapi` by default.
    // endpoint: '/api/v1'

    // DruxtEntity module settings; https://druxtjs.org/modules/entity
    entity: {
      // Disable the deprecated DruxtField components.
      components: { fields: false },

      query: {
        // Enable Drupal display mode schema based filtering of the JSON:API
        // resource to reduce query size.
        schema: true,
      },
    },

    // Druxt proxy settings.
    proxy: {
      // Proxy the JSON:API request via the Nuxt proxy to prevent CORS issues.
      api: true

      // Proxy the Drupal files system, using `sites/default/files` by default.
      // Disable the proxy, or set a specific site to proxy.
      // files: 'domain.tld'
    },

    // DruxtSite module settings; https://druxtjs.org/modules/site
    site: {
      // Disable the DruxtSite default layout.
      // layout: false,

      // Set the backend theme for DruxtBlock layouts.
      theme: 'umami'
    },

    // DruxtRouter module settings; https://druxtjs.org/modules/router
    router: {
      // Experimental; Disable the DruxtRouter page middleware, removing routing
      // requests and server side redirects. Doing this allows Full Static
      // builds without the need of a live Drupal backend. The Route is still
      // is retrieved by the fetch hook instead.
      // middleware: false

      // Disable the wildcard router, which is enabled by default in the
      // DruxtSite module. This allows more fine grained control over your
      // routing.
      // wildcard: false
    },

    // DruxtViews module settings; https://druxtjs.org/modules/views
    views: {
      query: {
        // Filter the View results using the Views bundle filter, if available.
        // This reduces requests to just ID and type, and can be done manually
        // if the bundle filter has not been set in Drupal.
        bundleFilter: true,
      }
    }
  },

  /**
   * Nuxt proxy module.
   */
  proxy: {
    '/en/jsonapi': baseUrl
  }
}

const baseUrl = process.env.GITPOD_WORKSPACE_ID
  ? `https://8080-${process.env.GITPOD_WORKSPACE_ID}.${process.env.GITPOD_WORKSPACE_CLUSTER_HOST}`
  : process.env.BASE_URL || 'http://drupal-9.ddev.site'
export default {
  target: 'static',
  generate: { routes: ['/'] },
  telemetry: true,
  buildModules: ['@nuxt/postcss8'],
  modules: [
    'druxt-auth',
    'druxt-site'
  ],
  druxt: {
    // The baseUrl of the Druxt enabled Drupal JSON:API server.
    baseUrl,

    // DruxtAuth module settings; https://github.com/druxt/druxt-auth
    auth: {
      // OAuth consumer ID.
      clientId: '1a6b8816-26de-4b70-bcdf-919600542f03',
    },

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

    // DruxtMenu module settings; https://druxtjs.org/modules/menu
    menu: {
      // Disable JSON:API Menu Items support. Enabled by the DruxtSite module.
      //jsonApiMenuItems: false
    },

    // Druxt proxy settings.
    proxy: {
      // Proxy the JSON:API request via the Nuxt proxy to prevent CORS issues.
      api: true

      // Proxy the Drupal files system, using `sites/default/files` by default.
      // Disable the proxy, or set a specific site to proxy.
      // files: 'domain.tld'
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

    // DruxtSite module settings; https://druxtjs.org/modules/site
    site: {
      // Disable the DruxtSite default layout.
      // layout: false,

      // Set the backend theme for DruxtBlock layouts.
      theme: 'umami'
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
  }
}

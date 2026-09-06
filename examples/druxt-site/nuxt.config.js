import { resolve } from 'path'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8888'
export default {
  target: 'static',
  generate: { routes: ['/'] },
  telemetry: true,
  // No head config at all meant no viewport meta tag shipped - mobile
  // browsers rendered the page at a desktop-width layout viewport, then
  // scaled the whole thing down to fit.
  head: {
    meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  },
  css: ['~/assets/css/main.css'],
  // The Druxt logo, pulsing, while the app boots.
  loadingIndicator: {
    name: resolve(__dirname, '../shared/static/druxt-loading.html'),
    background: '#fff',
  },
  buildModules: ['@nuxt/postcss8'],
  // Proxies the Umami theme's logo through this app's own origin - scoped
  // to this one file, not all of /core (Drupal core's own codebase).
  proxy: {
    '/core/profiles/demo_umami/themes/umami/logo.svg': baseUrl,
    // druxt.proxy.api only proxies the unprefixed /jsonapi. Once a route
    // resolves in Spanish, Druxt requests /es/jsonapi/... - proxy every
    // enabled language prefix or those requests miss the backend.
    '/en/jsonapi': baseUrl,
    '/es/jsonapi': baseUrl,
  },
  components: [{ path: '~/components', global: true }],
  // Explicitly registers two wrapper components Nuxt's directory auto-scan
  // wasn't picking up - see plugins/druxt-wrappers.js.
  plugins: ['~/plugins/druxt-wrappers.js'],
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

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
  // The Druxt logo, pulsing, while the app boots.
  loadingIndicator: {
    name: resolve(__dirname, '../shared/static/druxt-loading.html'),
    background: '#343a40',
  },
  // Pinned to match the OAuth consumer's committed redirect URI
  // (http://localhost:3004/callback) - see docs/drupal/.devtools/consumer-cleanup.php.
  server: { port: 3004 },
  // Self-hosted Source Sans 3 webfont - the weights the design uses.
  // Adobe renamed the family from "Source Sans Pro", and the prototype's
  // typography accordingly specifies Source Sans 3.
  css: [
    '@fontsource/source-sans-3/400.css',
    '@fontsource/source-sans-3/600.css',
    '@fontsource/source-sans-3/700.css',
    'bootstrap/dist/css/bootstrap.css',
    'bootstrap-vue/dist/bootstrap-vue.css',
    '~/assets/css/main.css',
  ],
  // Proxies the Umami logo and the OAuth endpoints through this app's own
  // origin - token/userInfo because @nuxtjs/auth-next fetches them from
  // the browser and the backend sends no CORS headers; authorize because
  // it's a top-level navigation that otherwise points at the backend's own
  // address, unreachable from anywhere but the machine running it (e.g.
  // over a tunnel). Anonymous /oauth/authorize hits also 302 straight to
  // Drupal's own login form (adding its default langcode prefix in the
  // same hop), so that redirect target needs proxying too, or it 404s
  // against this app's own router once the tunnel rewrites the redirect
  // back to this app's origin.
  //
  // The login/authorize entries also disable @nuxtjs/proxy's default
  // changeOrigin (on by default for every entry) - it rewrites the
  // forwarded request's Host header to the backend's own address, so
  // Drupal (which builds its post-login "destination" redirect from the
  // request's Host) sends the browser to that backend-internal address
  // instead of back through this app's own (possibly tunnelled) origin.
  // Only works under `nuxt dev`/`nuxt start`, not a fully static
  // `nuxt generate` build.
  proxy: {
    // Prefix match: the Umami theme's icons (required.svg, search.svg,
    // etc.) and webfonts live under the same directory as logo.svg - a
    // single entry covers all of them instead of enumerating each one.
    '/core/profiles/demo_umami/themes/umami': baseUrl,
    '/oauth/authorize': { target: baseUrl, changeOrigin: false },
    '/en/oauth/authorize': { target: baseUrl, changeOrigin: false },
    '/oauth/token': baseUrl,
    '/oauth/userinfo': baseUrl,
    '/user/login': { target: baseUrl, changeOrigin: false },
    '/en/user/login': { target: baseUrl, changeOrigin: false },
  },
  buildModules: ['bootstrap-vue/nuxt'],
  // Nuxt 2's default component auto-import is local-scope only - Druxt's
  // wrapper-component resolution (DruxtModule) only considers components
  // registered with global: true, so without this, theme overrides under
  // components/druxt/... are silently never picked up.
  components: [{ path: '~/components', global: true }],
  // Bespoke modules, not druxt-site - only what the console uses:
  // DruxtEntityForm (needs druxt-schema) and druxt/getCollection. No menu,
  // breadcrumb, views, or router module - also drops the wildcard route.
  // druxt-auth registers the OAuth2 (Authorization Code + PKCE) strategy.
  modules: [
    'druxt-auth',
    'druxt',
    'druxt-entity',
    'druxt-schema',
  ],
  // The oauth2 token exchange happens in the browser, so it rides the proxy
  // paths above rather than the backend origin directly (same reason as
  // druxt.proxy below). Everything else matches the druxt-auth defaults.
  auth: {
    strategies: {
      'drupal-authorization_code': {
        scheme: 'oauth2',
        endpoints: {
          authorization: '/oauth/authorize',
          token: '/oauth/token',
          userInfo: '/oauth/userinfo',
        },
        clientId: 'c6e3275c-05cb-45f0-a3c3-c037bf730963',
        responseType: 'code',
        grantType: 'authorization_code',
        codeChallengeMethod: 'S256',
      },
    },
  },
  druxt: {
    // The baseUrl of the Druxt enabled Drupal JSON:API server.
    baseUrl,

    // DruxtAuth module settings; https://github.com/druxt/druxt-auth
    // The client ID of the committed OAuth consumer on the backend
    // (public, PKCE, redirect http://localhost:3004/callback) - see
    // docs/drupal/.devtools/consumer-cleanup.php.
    auth: {
      clientId: 'c6e3275c-05cb-45f0-a3c3-c037bf730963',
    },

    // DruxtEntity module settings; https://druxtjs.org/modules/entity
    entity: {
      components: { fields: false },
      query: {
        schema: true,
      },
    },

    // Druxt proxy settings. `files: true` proxies Drupal's public file
    // system (recipe images etc.) through this app's own origin - without
    // it, JSON:API responses would return absolute backend URLs for
    // uploaded files, breaking for anyone viewing this app through a
    // different origin than the backend (e.g. a tunnel).
    proxy: {
      api: true,
      files: true,
    },
  }
}

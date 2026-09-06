import { resolve } from 'path'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8888'

export default {
  target: 'static',
  // Each example app owns a port (site 3000, daisyui 3001, tailwind 3002,
  // bootstrapvue 3004), so any two can run side by side locally without
  // colliding - and without start-server-and-test polling the wrong app.
  server: { port: 3001 },
  generate: { routes: ['/'] },
  telemetry: true,
  // No head config at all meant no viewport meta tag shipped - mobile
  // browsers rendered the page at a desktop-width layout viewport, then
  // scaled the whole thing down to fit, so a design that's mobile-first
  // by intent looked small and cramped on an actual phone.
  head: {
    meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  },
  // The Druxt logo, pulsing, while the app boots.
  loadingIndicator: {
    name: resolve(__dirname, '../shared/static/druxt-loading.html'),
    background: '#fff8f0',
  },
  // Self-hosted webfonts: Inter for body text, Fraunces for headings -
  // weights actually used by the design.
  css: [
    '@fontsource/inter/400.css',
    '@fontsource/inter/500.css',
    '@fontsource/inter/600.css',
    '@fontsource/inter/700.css',
    '@fontsource/fraunces/600.css',
    '@fontsource/fraunces/700.css',
    '~/assets/css/main.css',
  ],
  // Proxies just the Umami theme's logo through this app's own origin, same
  // idea as Druxt's built-in /sites/default/files proxy - an absolute
  // backend URL would break for anyone viewing this app through a different
  // origin than the backend is reachable at (e.g. a tunnel). Scoped to this
  // one file, not all of /core - that directory is Drupal core's own
  // codebase, and a wildcard proxy over it would expose far more than the
  // one static asset this app actually uses.
  proxy: {
    '/core/profiles/demo_umami/themes/umami/logo.svg': baseUrl,
  },
  buildModules: ['@nuxt/postcss8'],
  build: {
    postcss: {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    },
  },
  modules: [
    'druxt-site'
  ],
  // Recipe Box saved-collection persistence (see store/recipeBox.js).
  plugins: ['~/plugins/recipeBox.client'],
  druxt: {
    // The baseUrl of the Druxt enabled Drupal JSON:API server.
    baseUrl,

    // DruxtEntity module settings; https://druxtjs.org/modules/entity
    entity: {
      components: { fields: false },
      query: {
        schema: true,
      },
    },

    // Druxt proxy settings.
    proxy: {
      api: true
    },

    // DruxtSite module settings; https://druxtjs.org/modules/site
    site: {
      // Set the backend theme for DruxtBlock layouts.
      theme: 'umami'
    },

    // DruxtRouter module settings; https://druxtjs.org/modules/router
    router: {
      // Recipe Box only ever fetches recipes/categories directly
      // (assets/js/recipes.js, via druxt/getCollection) and shows detail
      // in-page (components/RecipeDetailPanel.vue) - it has no page that
      // needs to resolve an arbitrary Drupal path. Disabling the wildcard
      // router (enabled by default in the DruxtSite module) means this app
      // has no reachable surface beyond its own explicit pages, unlike a
      // real Druxt "Site" - see examples/druxt-site for that model.
      wildcard: false
    }
  }
}

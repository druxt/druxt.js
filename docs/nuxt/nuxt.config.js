// GA4. @nuxtjs/google-analytics (the module this used to run through) only
// ever spoke the Universal Analytics protocol via vue-analytics/analytics.js —
// UA stopped processing hits in July 2023, so it was silently collecting
// nothing. Nuxt 3+'s replacement, nuxt-gtag, depends on @nuxt/kit and can't
// run on this frozen Nuxt 2 stack, so this is a plain gtag.js snippet
// instead — no new runtime dependency, same head.script mechanism the
// colour-mode bridge already uses below.
const GA_MEASUREMENT_ID = 'G-Y1ZRHGDGSD'

// LAGOON_ENVIRONMENT_TYPE is 'production' only for the environment matching
// .lagoon.yml's `main` branch (druxtjs.org itself); every preview/branch
// build gets 'development'. yarn generate runs inside Lagoon's own build
// container (see docs/nuxt/Dockerfile), so this is set at generate time and
// bakes the right answer into the static output per environment — preview
// deploys never send hits into the real property.
const isProduction = process.env.LAGOON_ENVIRONMENT_TYPE === 'production'

// Routes generate:routeFailed reported; generate:done refuses to ship them.
const failedRoutes = []

import { SITE_NAME, SITE_DESCRIPTION, SITE_ORIGIN } from './lib/site'

/** The `druxt` package version, or null where the monorepo root isn't present. */
let druxtVersion = null
try {
  druxtVersion = require('../../packages/druxt/package.json').version
} catch (e) {
  druxtVersion = null
}

export default {
  target: 'static',

  // Shown in the header badge. Sourced from the `druxt` core package rather
  // than this site's own package.json (which doesn't track the framework).
  //
  // Guarded because the deploy image does not have the monorepo root:
  // docs/nuxt/Dockerfile's final stage is `COPY --from=builder /app/docs/nuxt
  // /app`, so this file lands at /app/nuxt.config.js and `../../packages`
  // resolves outside the image. Verified: MODULE_NOT_FOUND in that layout,
  // resolves fine from a repo checkout — which is why local and GitLab CI
  // `yarn generate` never caught it and only Lagoon deploys would break.
  // AppHeader's `v-if="version"` simply hides the badge when it is null.
  publicRuntimeConfig: {
    druxtVersion,
  },

  head: {
    titleTemplate: '%s - DruxtJS',
    htmlAttrs: { lang: 'en' },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' },
    ],
    // static/ ships icon.png, not a .ico — the old href 404s (on the live
    // site too, so this predates the redesign). @nuxtjs/pwa generates the
    // rest of the icon set from this same source image.
    link: [{ rel: 'icon', type: 'image/png', href: '/icon.png' }],
    script: [
      // Sets data-theme before first paint, mirroring the localStorage/OS
      // preference logic @nuxtjs/color-mode runs internally. Needed because
      // 2.1.1 (the last Nuxt-2-compatible release) only supports writing a
      // CSS class, not a data-theme attribute — see plugins/color-mode-
      // theme.client.js for the reactive half of this bridge.
      {
        hid: 'druxt-theme-init',
        innerHTML: "(function(){try{var k='druxt-color-mode';var p=localStorage.getItem(k)||'system';var v=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.setAttribute('data-theme',v)}catch(e){}})()",
        pbody: true,
      },
      // vue-meta re-executes this inline script on every client-side
      // navigation, so gtag('config') re-fires and reports the destination
      // page. That means client-side routing is already counted and a
      // router.afterEach page_view plugin would double-count them — measured
      // on a production-gated `yarn generate`, where one document load
      // produced js/config, then js/config again after a NuxtLink click.
      // Don't add one without re-measuring this first.
      ...(isProduction ? [
        { hid: 'ga-src', src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`, async: true },
        {
          hid: 'ga-init',
          innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`,
        },
      ] : []),
    ],
    __dangerouslyDisableSanitizersByTagID: {
      'druxt-theme-init': ['innerHTML'],
      ...(isProduction ? { 'ga-init': ['innerHTML'] } : {}),
    },
  },

  css: ['~/assets/css/app.css'],
  plugins: [
    '~/plugins/color-mode-theme.client.js',
    '~/plugins/analytics.client.js',
  ],
  components: true,

  // Mirrors the SITE_ORIGIN override into the client bundle so hydration
  // recomputes the same absolute URLs the generated HTML carries.
  env: {
    SITE_ORIGIN,
  },

  buildModules: [
    '@nuxtjs/pwa',
    '@nuxtjs/tailwindcss',
    // Dark mode: follows the OS by default, remembers an explicit choice.
    '@nuxtjs/color-mode',
  ],

  // The daisyUI themes in tailwind.config.js are named 'light' and 'dark'.
  // color-mode@2.1.1 only toggles a CSS class (no data-theme support until
  // v3, which requires Nuxt 3/4) — classSuffix: '' makes that class match
  // the theme name; plugins/color-mode-theme.client.js + the head.script
  // above bridge it to the data-theme attribute daisyUI actually reads.
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'druxt-color-mode',
  },

  pwa: {
    // @nuxtjs/pwa's meta module also emits Open Graph and Twitter tags, built
    // from this site's package.json. That made it a third source of share
    // metadata, and the values were wrong: og:title came out as "druxtjs-org",
    // the npm package name. It was invisible while nuxt-social-meta's hid-keyed
    // tags sat on top of it, and surfaced on the error pages the moment that
    // module was removed.
    //
    // utils/seo.js owns every og:* and twitter:* tag now. The manifest, icons
    // and theme-color this module also provides are still wanted, so it stays
    // registered with only its share tags turned off.
    meta: {
      // Without these, @nuxtjs/pwa names the app from package.json and the iOS
      // home-screen title reads "druxtjs-org". Same package-name leak as the
      // og:title above, in a place a share-tag audit does not look.
      name: SITE_NAME,
      description: SITE_DESCRIPTION,

      ogTitle: false,
      ogDescription: false,
      ogImage: false,
      ogUrl: false,
      twitterCard: false,
      twitterSite: false,
      twitterCreator: false,
    },

    manifest: {
      name: SITE_NAME,
      short_name: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
  },

  // nuxt-social-meta used to live here, injecting one site-wide Open Graph set
  // across all 130 routes. utils/seo.js now emits the full set per page, so the
  // module was a second source of truth for the share title and image that
  // could drift from it. Its tags were hid-keyed and so were being replaced
  // rather than duplicated, but everything it contributed (image dimensions,
  // the Twitter handle) has moved into seoHead.
  modules: [
    '@nuxt/content',
  ],

  content: {
    markdown: {
      // Anchors are what components/app/Toc.vue scroll-spies against.
      prism: { theme: 'prism-themes/themes/prism-material-oceanic.css' },
    },
  },

  generate: {
    /**
     * Every content route, given to the generator explicitly.
     *
     * Nuxt discovers dynamic routes by crawling links out of the pages it has
     * already generated. The API reference is listed by AppApiIndex, which
     * fetches its entries client side, so most of those links do not exist in
     * the generated HTML for the crawler to follow. Measured before this: 50 of
     * 109 API pages were written to dist, and the other 59 existed only as the
     * SPA fallback — served by 200.html, invisible to a crawler, and impossible
     * to list in a sitemap honestly.
     *
     * @returns {string[]} Route paths to generate.
     */
    routes() {
      const path = require('path')
      const { readContent } = require('./lib/content-index')
      return readContent(path.join(__dirname, 'content')).map((doc) => doc.route)
    },
  },

  hooks: {
    /**
     * Collects routes whose generation failed, so the build can refuse to
     * ship them. Without this, `nuxt generate` logs the error, writes the
     * error page as real HTML at the route, and exits 0 - the page then
     * serves as a live 200. Measured on production before the guard: seven
     * such pages, together taking 17% of sessions.
     *
     * @param {object} failure - The failed route.
     * @param {string} failure.route - The route path.
     */
    'generate:routeFailed'({ route }) {
      failedRoutes.push(route)
    },

    /**
     * Write the machine-readable indexes into the static export.
     *
     * `generate:done` rather than a build step so these run against the same
     * content the pages were just generated from, including `content/api`,
     * which docgen writes and which is absent from a fresh checkout. If it has
     * not been built, the API entries are simply missing rather than pointing
     * at URLs that were never generated.
     *
     * @param {object} generator - The Nuxt generator instance.
     */
    async 'generate:done'(generator, errors) {
      // Before the index writes: a rejected build must not leave a
      // sitemap or llms.txt on disk describing pages it refused to ship.
      // `errors` carries the "handled" failures (a route rendering the
      // error page, e.g. Document not found) that never fire
      // generate:routeFailed; the generator still writes those pages as
      // real HTML, so they count as failures here all the same.
      const handled = (errors || []).map((e) => e.route)
      const failed = [...new Set([...failedRoutes, ...handled])]
      if (failed.length) {
        throw new Error(
          'Refusing to ship ' + failed.length + ' route(s) that failed to generate: ' + failed.join(', '),
        )
      }

      const fs = require('fs')
      const path = require('path')
      const { execFileSync } = require('child_process')
      const { readContent } = require('./lib/content-index')
      const { buildLlmsTxt } = require('./lib/llms-txt')
      const { buildSitemap } = require('./lib/sitemap')

      const { srcDir, generate } = generator.nuxt.options
      const docs = readContent(path.join(srcDir, 'content'))

      await fs.promises.writeFile(path.join(generate.dir, 'llms.txt'), buildLlmsTxt(docs))
      await fs.promises.writeFile(path.join(generate.dir, 'sitemap.xml'), buildSitemap(docs))

      // A child process, not a require: satori and resvg crash inside this
      // process, where the esm config loader has patched the module system.
      const cards = execFileSync(process.execPath, [
        path.join(srcDir, 'scripts', 'og-render.js'),
        path.join(srcDir, 'content'),
        path.join(srcDir, 'assets', 'fonts'),
        path.join(generate.dir, 'og'),
      ], { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim()

      console.log('SEO: wrote llms.txt, sitemap.xml and ' + cards + ' share cards for ' + docs.length + ' documents')
    },
  },

  build: {},
  telemetry: true,

  storybook: {
    stories: [
      '~/components/**/*.stories.js',
      '~/layouts/**/*.stories.js',
      '~/pages/**/*.stories.js',
    ],
  },
}

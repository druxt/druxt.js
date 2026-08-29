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
  plugins: ['~/plugins/color-mode-theme.client.js'],
  components: true,

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

  modules: [
    '@nuxt/content',
    ['nuxt-social-meta', {
      title: 'DruxtJS - The Fully Decoupled Drupal Framework',
      site_name: 'DruxtJS',
      description: 'Druxt is a framework for building Fully Decoupled Drupal and Nuxt.js applications and sites.',
      img: 'https://druxtjs.org/og-druxt.png',
      img_size: { width: '1200', height: '630' },
      twitter: '@DruxtJS',
      twitter_card: 'summary_large_image',
    }],
  ],

  content: {
    markdown: {
      // Anchors are what components/app/Toc.vue scroll-spies against.
      prism: { theme: 'prism-themes/themes/prism-material-oceanic.css' },
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

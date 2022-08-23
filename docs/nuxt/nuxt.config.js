const baseUrl = process.env.GITPOD_WORKSPACE_ID
  ? `https://8080-${process.env.GITPOD_WORKSPACE_ID}.${process.env.GITPOD_WORKSPACE_CLUSTER_HOST}`
  : process.env.BASE_URL || 'http://druxtjs.ddev.site'

export default {
  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: '%s - DruxtJS',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: ['~/plugins/highlight.client.js'],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    ['@nuxtjs/google-analytics', {
      id: 'UA-172677199-1'
    }],
    '@nuxtjs/pwa',
    '@nuxtjs/tailwindcss',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/content
    '@nuxt/content',
    ['nuxt-social-meta', {
      title: 'DruxtJS - The Fully Decoupled Drupal Framework',
      site_name: 'DruxtJS',
      description: 'Druxt is a framework for building Fully Decoupled Drupal and Nuxt.js applications and sites.',
      img: 'https://druxtjs.org/og-druxt.png',
      img_size: {
        width: '1200',
        height: '630',
      },
      twitter: '@DruxtJS',
      twitter_card: 'summary_large_image',
    }],
    'druxt-site',
    'druxt-layout-paragraphs',
  ],

  // DruxtJS configuration.
  druxt: {
    baseUrl,
    entity: {
      components: {
        fields: false,
      }
    }
  },

  // Content module configuration: https://go.nuxtjs.dev/config-content
  content: {},

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},

  telemetry: true,

  storybook: {
    stories: [
      '~/components/**/*.stories.js',
      '~/layouts/**/*.stories.js',
      '~/pages/**/*.stories.js',
    ]
  }
}

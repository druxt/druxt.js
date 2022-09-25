const baseUrl = process.env.GITPOD_WORKSPACE_ID
  ? `https://8080-${process.env.GITPOD_WORKSPACE_ID}.${process.env.GITPOD_WORKSPACE_CLUSTER_HOST}`
  : process.env.BASE_URL || 'http://drupal-9.ddev.site'

export default {
  buildModules: [
    'druxt-entity',
    'druxt-views',
    '@nuxtjs/vuetify',
    '@nuxtjs/composition-api/module'
  ],
  druxt: {
    baseUrl
  },
  head: {
    titleTemplate: '%s - Druxt Entity Form Example',
    title: 'Druxt Entity Form Example',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    ],
  },
}

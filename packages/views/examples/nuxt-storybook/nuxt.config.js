export default {
  components: true,
  modules: ['druxt-views', '~/modules/nuxt-storybook-proxy'],
  druxt: { baseUrl: 'https://demo-api.druxtjs.org' },
  proxy: { '/sites/default/files': 'https://demo-api.druxtjs.org' },
}

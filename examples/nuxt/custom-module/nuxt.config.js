export default {
  modules: [['druxt', { baseUrl: 'https://demo-api.druxtjs.org' }]],
  components: [
    {
      path: '~/components/druxt',
      prefix: 'druxt',
      global: true
    }
  ]
}

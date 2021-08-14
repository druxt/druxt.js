export default {
  components: true,
  modules: [
    'bootstrap-vue/nuxt',
    'druxt-menu',
  ],
  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org/',
    menu: {
      jsonApiMenuItems: true,
    },
  }
}

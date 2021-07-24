const baseUrl = 'https://demo-api.druxtjs.org'

export default {
  build: {
    extend(config) {
      config.resolve.alias.vue$ = 'vue/dist/vue.esm.js'
    },
  },
  components: true,
  buildModules: ['@nuxtjs/vuetify'],
  modules: ['druxt-entity'],
  druxt: { baseUrl },
  proxy: [baseUrl + '/sites/default/files']
}

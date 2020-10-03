// const baseUrl = 'https://demo-api.druxtjs.org'
const baseUrl = 'http://demo-api-druxtjs-org.docker.amazee.io'

export default {
  build: {
    extend(config) {
      config.resolve.alias.vue$ = 'vue/dist/vue.esm.js'
    },
  },
  buildModules: ['@nuxtjs/vuetify'],
  components: [{
    path: '~/components/nodes',
    prefix: 'druxt-entity-node',
    global: true
  }],
  modules: [
    'druxt',
    'druxt-entity',
    'druxt-router',
    'druxt-schema'
  ],
  druxt: { baseUrl }
}

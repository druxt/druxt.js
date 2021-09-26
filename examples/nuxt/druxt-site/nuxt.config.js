const baseUrl = process.env.BASE_URL || 'https://demo-api.druxtjs.org'
export default {
  target: 'static',
  generate: { routes: ['/'] },
  telemetry: true,
  components: true,
  modules: ['druxt-site'],
  druxt: {
    baseUrl,
    entity: { components: { fields: false } },
    router: { pages: false },
    site: { theme: 'umami' }
  },
}

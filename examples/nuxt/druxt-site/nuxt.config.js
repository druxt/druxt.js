const baseUrl = process.env.BASE_URL || 'https://demo-api.druxtjs.org'
export default {
  target: 'static',
  generate: { routes: ['/'] },
  telemetry: true,
  modules: ['druxt-site'],
  druxt: {
    baseUrl,
    entity: { components: { fields: false } },
    proxy: { api: true },
    site: {
      // layout: false,
      theme: 'umami'
    }
  },
  proxy: {
    '/en/jsonapi': baseUrl
  }
}

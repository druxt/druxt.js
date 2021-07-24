export default {
  target: 'static',
  modules: ['druxt-site'],
  druxt: { baseUrl: 'https://demo-api.druxtjs.org' },
  proxy: ['https://demo-api.druxtjs.org/sites/default/files']
}

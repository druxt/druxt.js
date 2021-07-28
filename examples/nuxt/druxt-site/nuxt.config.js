export default {
  target: 'static',
  generate: { routes: ['/'] },
  modules: ['druxt-site'],
  druxt: { baseUrl: 'http://localhost:8080' },
  proxy: ['http://localhost:8080/sites/default/files']
}

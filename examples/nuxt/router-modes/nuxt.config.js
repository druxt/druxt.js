export default {
  buildModules: ['druxt-site'],
  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org',
    router: {
      // Middleware on the wildcard router is enabled by default, and supports
      // serverside redirect handling.
      // Disable the middleware for serverless, full static builds.
      // middleware: false

      // Wildcard router is enabled by the DruxtSite module.
      // wildcard: false
    },
    site: {
      // Disable the default Site layout.
      layout: false
    }
  }
}

const baseUrl = process.env.GITPOD_WORKSPACE_ID
  ? `https://8080-${process.env.GITPOD_WORKSPACE_ID}.${process.env.GITPOD_WORKSPACE_CLUSTER_HOST}`
  : process.env.BASE_URL || 'http://drupal-9.ddev.site'

export default {
  buildModules: ['druxt-site'],
  druxt: {
    baseUrl,
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

const baseUrl = process.env.GITPOD_WORKSPACE_ID
  ? `https://8080-${process.env.GITPOD_WORKSPACE_ID}.${process.env.GITPOD_WORKSPACE_CLUSTER_HOST}`
  : process.env.BASE_URL || 'http://drupal-9.ddev.site'

export default {
  buildModules: [
    'druxt-entity',
    'druxt-views'
  ],
  druxt: {
    baseUrl
  }
}

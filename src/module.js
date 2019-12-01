import { resolve } from 'path'

export default async function (options = {}) {
  this.extendRoutes((routes, resolve) => {
    // Delete all existing routes.
    // @TODO - Make this more configurable.
    for (const index in routes) {
      delete routes[index]
    }

    // Add Druxt router custom wildcard route.
    routes.push({
      name: 'druxt-router',
      path: '*',
      component: resolve(__dirname, 'component.js'),
      chunkName: 'druxt-router'
    })
  })

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, 'plugin.js'),
    fileName: 'druxtRouter.plugin.js',
    options
  })

  // Add Vuex plugin.
  // @TODO - Ensure Vuex store is available.
  this.addPlugin({
    src: resolve(__dirname, 'store.js'),
    fileName: 'druxtRouter.store.js',
    options
  })
}
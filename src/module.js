import { resolve } from 'path'

export default function (moduleOptions = {}) {
  const options = {
    ...this.options['druxt-router'],
    ...moduleOptions
  }

  this.extendRoutes((routes, resolve) => {
    // Delete all existing routes.
    // @TODO - Make this more configurable.
    for (const index in routes) {
      delete routes[index]
    }

    // Add Druxt router custom wildcard route.
    this.addTemplate({
      src: resolve(__dirname, 'component.js'),
      fileName: 'components/druxt-router.js',
      options
    })
    routes.push({
      name: 'druxt-router',
      path: '*',
      component: resolve(this.options.buildDir, 'components/druxt-router.js'),
      chunkName: 'druxt-router'
    })
  })

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, 'plugin.js'),
    fileName: 'druxt-router.js',
    options
  })

  // Add Vuex plugin.
  // @TODO - Ensure Vuex store is available.
  this.addPlugin({
    src: resolve(__dirname, 'store.js'),
    fileName: 'store/druxt-router.js',
    options
  })
}

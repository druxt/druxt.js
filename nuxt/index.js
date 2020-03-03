import { resolve } from 'path'

export default function (moduleOptions = {}) {
  const options = {
    ...this.options['druxt-router'],
    ...moduleOptions
  }

  this.extendRoutes((routes, resolve) => {
    // Only add router component if custom component is undefined.
    // @TODO - Validate custom component.
    // @TODO - Add test for custom component.
    if (!options.component) {
      options.component = resolve(this.options.buildDir, 'components/druxt-router.js')
      this.addTemplate({
        src: resolve(__dirname, 'component.js'),
        fileName: 'components/druxt-router.js',
        options
      })
    }

    // Add Druxt router custom wildcard route.
    routes.push({
      name: 'druxt-router',
      path: '*',
      component: options.component,
      chunkName: 'druxt-router'
    })
  })

  // Add plugin.
  this.addPlugin({
    src: resolve(__dirname, 'plugin.template.js'),
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

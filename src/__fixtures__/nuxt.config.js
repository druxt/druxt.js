const path = require('path')

module.exports = {
  srcDir: __dirname,
  rootDir: path.resolve(__dirname),
  buildDir: path.resolve(__dirname, '.nuxt'),
  dev: false,

  modules: [
    {
      handler: require('../index').default
    }
  ],

  druxt: {
    baseUrl: 'https://example.com'
  },

  build: {
    extend (config) {
      config.resolve.alias['druxt-router'] = '../../..'
    }
  }
}

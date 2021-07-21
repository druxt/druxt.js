import { resolve } from 'path'

export default function (moduleOptions = {}) {
  this.nuxt.hook('storybook:config', ({ stories }) => {
    const { addTemplate, options } = this

    // Proxy middleware.
    if (options.proxy) {
      addTemplate({
        src: resolve(__dirname, './templates/middleware.js'),
        fileName: 'storybook/middleware.js',
        options,
      })
    }
  })
}

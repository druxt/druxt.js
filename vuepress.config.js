const config = require('druxt-docgen/src/vuepress.config')

config.themeConfig.repo = 'druxt/druxt.js'

const sidebar = config.themeConfig.locales['/'].sidebar['/']
for (const i in sidebar) {
  if (sidebar[i].title === 'Guide') {
    sidebar[i].children.push('/guide/modules')
    sidebar[i].children.push('/guide/client')
    sidebar[i].children.push('/guide/theming')
  }
  if (sidebar[i].title === 'API Reference') {
    sidebar[i].children.push('/guide/deprecations')
  }
}

module.exports = config

const config = require('druxt-docgen/src/vuepress.config')

config.themeConfig.repo = 'druxt/druxt.js'

const sidebar = config.themeConfig.locales['/'].sidebar['/']
for (const i in sidebar) {
  if (sidebar[i].title === 'Guide') {
    sidebar[i].children.push('/guide/client')
  }
}

module.exports = config

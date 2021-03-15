const config = require('druxt-docgen/src/vuepress.config')

const sidebar = config.themeConfig.locales['/'].sidebar['/']
for (const i in sidebar) {
  if (sidebar[i].title === 'DruxtJS Fields') {
    sidebar[i].collapsable = true
    sidebar[i].collapsed = true
  }
}

module.exports = config

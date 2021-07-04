const config = require('druxt-docgen/src/vuepress.config')

const sidebar = config.themeConfig.locales['/'].sidebar['/']

// Remove deprecated items from the sidebar.
for (const i in sidebar) {
  if (sidebar[i].title === 'DruxtJS Fields') {
    sidebar.splice(i, 1)
    break
  }
}

module.exports = config

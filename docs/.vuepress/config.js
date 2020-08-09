const path = require('path')
const glob = require('globby')
const cwd = path.join(__dirname, '..')

const sidebar = [{
  title: 'Guide',
  collapsable: false,
  children: [
    '/guide/',
    '/guide/getting-started'
  ]
}]

const sections = [
  {
    title: 'API Reference',
    path: 'api',
  },
  {
    title: 'Druxt.js Fields',
    path: 'api/components/fields',
  },
  {
    title: 'Vue.js Components',
    path: 'api/components',
  },
  {
    title: 'Vue.js Mixins',
    path: 'api/mixins',
  },
  {
    title: 'Vuex stores',
    path: 'api/stores',
  },
  {
    title: 'Type definitions',
    path: 'api/typedefs'
  }
]
sections.map(section => {
  const files = glob.sync(section.path + '/*.md', { cwd }).map(file => '/' + file.replace('README', '').replace('.md', ''))
  if (!files.length) return
  files.sort()

  sidebar.push({
    title: section.title,
    collapsable: false,
    path: '/' + section.path,
    children: files
  })
})

const components = glob.sync('src/components/**/*.vue').map(f => ({
  name: f.split('/').pop().split('.').shift(),
  path: path.resolve(f)
}))

module.exports = {
  base: '/druxt-schema/',
  head: [
    ['link', { rel: "apple-touch-icon", sizes: "57x57", href: "/apple-icon-57x57.png" } ],
    ['link', { rel: "apple-touch-icon", sizes: "60x60", href: "/apple-icon-60x60.png" } ],
    ['link', { rel: "apple-touch-icon", sizes: "72x72", href: "/apple-icon-72x72.png" } ],
    ['link', { rel: "apple-touch-icon", sizes: "76x76", href: "/apple-icon-76x76.png" } ],
    ['link', { rel: "apple-touch-icon", sizes: "114x114", href: "/apple-icon-114x114.png" } ],
    ['link', { rel: "apple-touch-icon", sizes: "120x120", href: "/apple-icon-120x120.png" } ],
    ['link', { rel: "apple-touch-icon", sizes: "144x144", href: "/apple-icon-144x144.png" } ],
    ['link', { rel: "apple-touch-icon", sizes: "152x152", href: "/apple-icon-152x152.png" } ],
    ['link', { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-icon-180x180.png" } ],
    ['link', { rel: "icon", type: "image/png", sizes: "192x192", href: "/android-icon-192x192.png" } ],
    ['link', { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" } ],
    ['link', { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png" } ],
    ['link', { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" } ],
    ['link', { rel: "manifest", href: "/manifest.json" }],
    ['meta', { name: "msapplication-TileColor", content: "#ffffff" } ],
    ['meta', { name: "msapplication-TileImage", content: "/ms-icon-144x144.png" } ],
    ['meta', { name: "theme-color", content: "#ffffff" } ],
  ],
  locales: {
    '/': {
      title: 'Druxt.js Schema',
      description: 'Entity Form and View mode schemas for Drupal driven frontends.',
    }
  },
  markdown: {
    extendMarkdown: md => {
      md.use(require('markdown-it-task-lists'))
    },
    lineNumbers: true
  },
  plugins: [
    ['@vuepress/register-components', { components }],
    ['live']
  ],
  themeConfig: {
    docsDir: 'docs',
    editLinks: true,
    logo: '/logo.svg',
    locales: {
      '/': {
        ariaLabel: 'Languages',
        label: 'English',
        lastUpdated: 'Last Updated',
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'API', link: '/api/' },
        ],
        selectText: 'Languages',
        sidebar: {
          '/': sidebar
        }
      },
    },
    repo: 'druxt/druxt-entity',
    sidebarDepth: 4,
    smoothScroll: true,
  }
}

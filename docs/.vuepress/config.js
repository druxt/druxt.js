const { sidebarTree } = require('../api/config');

module.exports = {
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
      title: 'Druxt.js Router',
      description: 'Simple decoupled Drupal routing for Nuxt.js',
    }
  },
  markdown: {
    extendMarkdown: md => {
      md.use(require('markdown-it-task-lists'))
    },
    lineNumbers: true
  },
  themeConfig: {
    docsDir: 'docs',
    editLinks: true,
    logo: '/logo.svg',
    locales: {
      '/': {
        ariaLabel: 'Languages',
        label: 'English',
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'API', link: '/api/' },
        ],
        selectText: 'Languages',
        sidebar: Object.assign({
          '/guide/': [{
            title: 'Guide',
            collapsable: false,
            children: [
              '/guide/',
              '/guide/getting-started'
            ]
          }]
        }, sidebarTree('Introduction'))
      },
    },
    repo: 'druxt/druxt-router',
    sidebarDepth: 4,
    smoothScroll: true,
  }
}

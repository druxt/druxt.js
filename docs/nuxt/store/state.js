export default () => ({
  // Main menu items. Unchanged from the current site: components/app/Menu.vue
  // derives its active and open state from the route instead.
  menu: [{
    component: 'NuxtLink',
    text: 'Home',
    icon: 'home',
    props: { to: '/' },
    children: [],
  },
  {
    component: 'NuxtLink',
    text: 'Modules',
    icon: 'modules',
    props: { to: '/modules' },
    children: [],
  },
  {
    component: 'NuxtLink',
    text: 'Guide',
    icon: 'guide',
    props: { to: '/guide' },
    children: [],
  },
  {
    component: 'NuxtLink',
    text: 'API',
    icon: 'api',
    props: { to: '/api' },
    children: [],
  },
  {
    component: 'a',
    text: 'GitHub',
    icon: 'github',
    props: { href: 'https://github.com/druxt/druxt.js', target: '_blank' },
    children: [],
  },
  {
    component: 'a',
    text: 'Discord',
    icon: 'discord',
    // The invite directly, not discord.druxtjs.org: that vanity host is a
    // GitHub Pages redirect whose certificate only covers *.github.io, so
    // every browser shows a full-page TLS interstitial before it can
    // redirect. Verified with openssl and curl.
    props: { href: 'https://discord.gg/QnZD46c', target: '_blank' },
    children: [],
  }],

  // Druxt modules, populated by nuxtServerInit.
  modules: [],

  // Recently opened documents.
  recent: [],

  // Table of contents for the current document, read by components/app/Toc.vue.
  toc: [],

  // Recent search queries, read by components/app/Search.vue.
  searches: [],
})

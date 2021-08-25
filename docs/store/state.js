export default () => ({
  // Main menu items.
  menu: [{
    component: "NuxtLink",
    text: "Home",
    props: { to: "/" },
  },
  {
    component: "NuxtLink",
    text: "API",
    props: { to: "/api" },
  },
  {
    component: "NuxtLink",
    text: "Guide",
    props: { to: "/guide" },
  },
  {
    component: "a",
    text: "GitHub",
    // TODO: Add external icon.
    props: {
      href: "https://github.com/druxt/druxt.js",
      target: "_blank",
    },
  }],

  // Package list.
  // TODO: get this data programatically.
  packages: [
    'druxt',
    'breadcrumb',
    'blocks',
    'entity',
    'menu',
    'router',
    'schema',
    'site',
    'views'
  ],

  // Recently opened documents.
  recent: [],
})

export default () => ({
  // Main menu items.
  menu: [{
    component: "NuxtLink",
    text: "Home",
    icon: "home",
    props: { to: "/" },
    children: [],
  },
  {
    component: "NuxtLink",
    text: "Modules",
    icon: "modules",
    props: { to: "/modules" },
    children: [],
  },
  {
    component: "NuxtLink",
    text: "Guide",
    icon: "guide",
    props: { to: "/guide" },
    children: [],
  },
  {
    component: "NuxtLink",
    text: "API",
    icon: "api",
    props: { to: "/api" },
    children: [],
  },
  {
    component: "a",
    text: "GitHub",
    icon: "external",
    props: {
      href: "https://github.com/druxt/druxt.js",
      target: "_blank",
    },
    children: [],
  },
  {
    component: "a",
    text: "Discord",
    icon: "external",
    props: {
      href: "https://discord.druxtjs.org",
      target: "_blank",
    },
    children: [],
  }],

  // Recently opened documents.
  recent: [],
})

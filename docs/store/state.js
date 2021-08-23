export default () => ({
  // Main menu items.
  menu: [{
    title: 'Home',
    path: '/',
  }, {
    title: 'API documentation',
    path: '/api',
  }],

  // Module list.
  // TODO: get this data programatically.
  modules: [
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

export default () => ({
  // Main menu items.
  menu: [{
    title: 'Home',
    path: '/',
  }, {
    title: 'API documentation',
    path: '/api',
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

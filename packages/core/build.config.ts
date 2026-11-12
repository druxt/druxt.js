// nuxt-module-build builds src/module and src/runtime. This adds the
// build-time helpers Druxt modules import from @druxt/core/kit, and the
// framework-free subpaths, @druxt/core/anchors and @druxt/core/routes.
export default {
  entries: ['src/kit', { input: 'src/anchors/index', name: 'anchors' }, { input: 'src/routes/index', name: 'routes' }],
}

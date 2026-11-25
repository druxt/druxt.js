// nuxt-module-build builds src/module and src/runtime. This adds the
// build-time helpers Druxt modules import from @druxt/core/kit, and the
// framework-free subpaths, @druxt/core/anchors, @druxt/core/classes, @druxt/core/markup, @druxt/core/files, @druxt/core/fields,
// @druxt/core/routes and @druxt/core/edit.
export default {
  entries: ['src/kit', { input: 'src/anchors/index', name: 'anchors' }, { input: 'src/classes/index', name: 'classes' }, { input: 'src/markup/index', name: 'markup' }, { input: 'src/files/index', name: 'files' }, { input: 'src/fields/index', name: 'fields' }, { input: 'src/routes/index', name: 'routes' }, { input: 'src/edit/index', name: 'edit' }],
}

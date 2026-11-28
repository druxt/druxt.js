---
'druxt': minor
'druxt-blocks': minor
'druxt-breadcrumb': minor
'druxt-entity': minor
'druxt-menu': minor
'druxt-router': minor
'druxt-schema': minor
'druxt-site': minor
'druxt-views': minor
---

feat(#1070): the built files now come with source maps, so a debugger attached to a Nuxt build or server steps through the original source and not the bundle.

VS Code ignores source maps inside `node_modules` by default. To use them in a site, add `"resolveSourceMapLocations": ["${workspaceFolder}/**"]` to the launch configuration. The maps add about 0.8 MB to the installed packages in total, and nothing to what a browser downloads.

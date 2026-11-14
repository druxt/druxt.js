import { defineBuildConfig } from 'unbuild'

// A plain library build: ESM and declarations, dependencies left external.
export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  rollup: { emitCJS: false },
})

import { defineBuildConfig } from 'unbuild'

// A plain library build: ESM and declarations, with no dependencies.
export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  rollup: { emitCJS: false },
})

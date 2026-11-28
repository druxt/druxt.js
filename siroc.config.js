import { defineSirocConfig } from 'siroc'

export default defineSirocConfig({
  rollup: {
    output: {
      exports: 'named',
      // Maps back to src, so a debugger in a site that uses a package steps
      // through the source and not the bundle.
      sourcemap: true,
    },
  },
})

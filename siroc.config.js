import { defineSirocConfig } from 'siroc'

export default defineSirocConfig({
  rollup: {
    output: {
      exports: 'named',
    },
  },
})

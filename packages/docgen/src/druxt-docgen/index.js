import consola from 'consola'
import yargs from 'yargs'

import { DruxtDocgen } from '..'

const argv = yargs
  .option('config', {
    alias: 'c',
    description: 'Path to config',
    type: 'string',
  })
  .help()
  .alias('help', 'h')
  .argv

const druxtDocgen = new DruxtDocgen(argv.config || null)

async function main() {
  // Generate documentation.
  await druxtDocgen.generateDocs()
}

main().catch((error) => {
  consola.error(error)
  process.exit(1)
})
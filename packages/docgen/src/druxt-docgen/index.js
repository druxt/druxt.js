import consola from 'consola'
import yargs from 'yargs'

import { DruxtDocgen } from '..'

const argv = yargs
  .option('destination', {
    alias: 'd',
    default: 'content',
    description: 'Directory the generated Markdown is written to',
    type: 'string',
  })
  .help()
  .alias('help', 'h')
  .argv

const druxtDocgen = new DruxtDocgen({ destination: argv.destination })

async function main() {
  // Generate documentation.
  await druxtDocgen.generateDocs()
}

main().catch((error) => {
  consola.error(error)
  process.exit(1)
})
#!/usr/bin/env node

const yargs = require('yargs')
const DruxtDocgen = require('..')

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

const main = async function () {
  // Generate documentation.
  await druxtDocgen.generateDocs()

  // Run Vuepress server.
  druxtDocgen.runServer()
}

main()

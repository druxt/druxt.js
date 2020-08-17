#!/usr/bin/env node

const DruxtDocgen = require('..')
const druxtDocgen = new DruxtDocgen()

const main = async function () {
  // Generate documentation.
  await druxtDocgen.generateDocs()

  // Run Vuepress server.
  druxtDocgen.runServer()
}

main()

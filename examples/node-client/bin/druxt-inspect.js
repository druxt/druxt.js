#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')

const { createClients } = require('../src/index')
const { parseArgs } = require('../src/args')
const { sample, renderSample } = require('../src/commands/sample')
const { schema, renderSchema } = require('../src/commands/schema')
const { stubs, renderStubs } = require('../src/commands/stubs')
const { types, renderTypes } = require('../src/commands/types')
const { views, renderViews } = require('../src/commands/views')

const { version } = require('../package.json')

// Commands that name a resource type take it as their one positional
// argument; types/views take none.
const COMMANDS = {
  types: { run: types, render: renderTypes, arg: null },
  schema: { run: schema, render: renderSchema, arg: 'resourceType' },
  stubs: { run: stubs, render: renderStubs, arg: 'resourceType' },
  sample: { run: sample, render: renderSample, arg: 'resourceType' },
  views: { run: views, render: renderViews, arg: null },
}

const USAGE = `Usage: druxt-inspect [options] <command> [args]

Commands:
  types                            List the JSON:API resource types
  schema <resourceType>            Print the view and form schemas
  stubs <resourceType>             Generate Druxt Entity wrapper stub(s)
  sample <resourceType>            Fetch a sample of entities
  views                            List the backend's Views

Options:
  -b, --baseUrl <url>              Drupal backend base URL
                                   (or set DRUXT_BASE_URL)
  -m, --mode <mode>                Display mode (schema, stubs)
  -o, --output <dir>               Write stub files to a directory (stubs)
  -l, --limit <n>                  Number of entities (sample)
      --json                       Output raw JSON instead of a table
  -V, --version                    Output the version number
  -h, --help                       Show this help
`

/**
 * Writes each generated stub to the output directory.
 *
 * @param {string} dir - The target directory.
 * @param {{ filename: string, contents: string }[]} files - The stub files.
 *
 * @returns {string} A summary of what was written.
 */
const writeStubs = (dir, files) => {
  fs.mkdirSync(dir, { recursive: true })
  return files
    .map((file) => {
      const target = path.join(dir, file.filename)
      fs.writeFileSync(target, file.contents)
      return `Wrote ${target}`
    })
    .join('\n')
}

const main = async () => {
  const { command, args, options } = parseArgs(process.argv.slice(2))

  if (options.version) return console.log(version)
  if (options.help || !command) return console.log(USAGE)

  const entry = COMMANDS[command]
  if (!entry) {
    throw new Error(`Unknown command '${command}'. See --help for the list.`)
  }

  const resourceType = entry.arg ? args[0] : undefined
  if (entry.arg && !resourceType) {
    throw new Error(`'${command}' expects a ${entry.arg}, e.g. node--recipe.`)
  }

  const clients = createClients(options.baseUrl || process.env.DRUXT_BASE_URL)

  const commandOptions = {}
  if (options.mode) commandOptions.mode = options.mode
  if (options.limit) commandOptions.limit = Number(options.limit)

  const data = entry.arg
    ? await entry.run(clients, resourceType, commandOptions)
    : await entry.run(clients, commandOptions)

  if (options.json) return console.log(JSON.stringify(data, null, 2))

  // --output only means anything for stubs; everywhere else the rendered
  // form goes to stdout.
  if (command === 'stubs' && options.output) {
    return console.log(writeStubs(options.output, data.files))
  }

  console.log(entry.render(data))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

#!/usr/bin/env node

'use strict'

/**
 * Records JSON:API fixture responses for the druxt-inspect test suite.
 *
 * Run manually against a live Druxt backend (default: the docs/drupal Umami
 * dev server on http://127.0.0.1:8888):
 *
 *   cd examples/node-client
 *   DRUXT_BASE_URL=http://127.0.0.1:8888 node test/record.js
 *
 * It executes every command through a recording adapter and writes each
 * response body to test/fixtures/, along with the manifest that
 * test/adapter.js replays from. Re-run when the fixture data genuinely
 * needs to change - not as part of the test suite.
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')

const { DruxtClient } = require('druxt')
const { DruxtSchema } = require('druxt-schema')

const baseUrl = process.env.DRUXT_BASE_URL || 'http://127.0.0.1:8888'
const FIXTURES_DIR = path.join(__dirname, 'fixtures')
const manifestPath = path.join(FIXTURES_DIR, 'manifest.json')
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {}

const { fixtureName, normalize } = require('./adapter')

const recordingAdapter = async (config) => {
  const url = normalize(config.url, config.baseURL)
  const method = (config.method || 'get').toLowerCase()
  const key = `${method} ${url}`

  if (!manifest[key]) {
    const response = await axios({ ...config, url: baseUrl + url, baseURL: undefined, adapter: undefined })
    const file = fixtureName(method, url)
    fs.mkdirSync(FIXTURES_DIR, { recursive: true })
    fs.writeFileSync(path.join(FIXTURES_DIR, file), JSON.stringify(response.data, null, 2))
    manifest[key] = file
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    console.log(`recorded ${key}`)
  } else {
    console.log(`cached    ${key}`)
  }

  const data = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, manifest[key]), 'utf8'))
  return { status: 200, statusText: 'OK', headers: {}, data, config }
}

const axiosInstance = axios.create({ adapter: recordingAdapter })

const druxt = new DruxtClient(baseUrl, { axios: axiosInstance })
druxt.settings = {}
const druxtSchema = new DruxtSchema(baseUrl, { axios: axiosInstance })

async function main() {
  const { types } = require('../src/commands/types')
  const { schema } = require('../src/commands/schema')
  const { stubs } = require('../src/commands/stubs')
  const { sample } = require('../src/commands/sample')
  const { views } = require('../src/commands/views')

  await types({ druxt })
  await schema({ schema: druxtSchema }, 'node--recipe', { mode: 'default' })
  await schema({ schema: druxtSchema }, 'node--recipe', { mode: 'card' })
  await schema({ schema: druxtSchema }, 'node--page', { mode: 'default' })
  await stubs({ schema: druxtSchema }, 'node--recipe', { mode: 'default' })
  await sample({ druxt }, 'node--recipe', { limit: 3 })
  await sample({ druxt }, 'node--page', { limit: 2 })
  await views({ druxt })

  console.log(`\n${Object.keys(manifest).length} fixtures in ${FIXTURES_DIR}`)
}

main().catch((err) => { console.error(err); process.exit(1) })

'use strict'

/**
 * Fixture-based axios adapter for the druxt-inspect test suite.
 *
 * DruxtClient accepts an axios instance via `options.axios` (that's the
 * injection point Nuxt's plugin uses to hand over @nuxtjs/axios). The tests
 * pass an instance whose adapter is one of the two modes implemented here:
 *
 * - **replay** (default): serves responses from `test/fixtures`, keyed by
 *   request path + query string. No network access - the suite runs without
 *   a backend, which is exactly why it stays fast in CI.
 * - **record**: performs the real request and saves the response body,
 *   building the fixture manifest used by replay mode.
 *
 * Fixtures are recorded from the docs/drupal Umami backend by
 * `node test/record.js` (see that file) - only re-record when the data
 * genuinely needs to change.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const axios = require('axios')

const FIXTURES_DIR = path.join(__dirname, 'fixtures')

/**
 * Normalizes a request URL to its path + query string.
 *
 * @param {string} url - The URL as passed to the adapter (may be relative,
 *   absolute-with-origin, or accompanied by a separate baseURL).
 * @param {string} [baseURL] - The axios instance's baseURL, if any.
 *
 * @returns {string} e.g. `/jsonapi/node/recipe?page%5Blimit%5D=3`.
 */
const normalize = (url, baseURL) => {
  let full = url || ''
  if (baseURL && !/^https?:\/\//.test(full)) {
    full = baseURL.replace(/\/$/, '') + full
  }
  return full.replace(/^https?:\/\/[^/]+/, '')
}

/**
 * Maps a normalized URL to a fixture filename.
 *
 * The hash covers the whole URL - these queries differ only in a filter
 * value deep in the query string (`filter[drupal_internal__id]=node.recipe.
 * default` vs `user.user.default`), so a prefix-based slug alone would
 * collide them all into one file.
 *
 * @param {string} method - The HTTP method.
 * @param {string} url - The normalized URL.
 *
 * @returns {string} The fixture file name.
 */
const fixtureName = (method, url) => {
  const slug = url
    .replace(/^\//, '')
    .replace(/[/?&=%]/g, '_')
    .slice(0, 80)
  const hash = crypto.createHash('md5').update(`${method} ${url}`).digest('hex').slice(0, 16)
  return `${method}-${slug}-${hash}.json`
}

/**
 * Creates an axios instance that replays recorded fixtures.
 *
 * @param {object} [options] - Adapter options.
 * @param {boolean} [options.strict=true] - When true, an unmatched request
 *   fails the test instead of returning a bare 404.
 *
 * @returns {object} An axios instance (callable, as DruxtClient expects).
 */
const createFixtureAxios = ({ strict = true } = {}) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'manifest.json'), 'utf8'))

  const adapter = (config) => {
    const url = normalize(config.url, config.baseURL)
    const method = (config.method || 'get').toLowerCase()
    const key = `${method} ${url}`

    const file = manifest[key]
    if (!file) {
      if (strict) {
        return Promise.reject(new Error(`No fixture recorded for ${key}. Run 'node test/record.js' against a live backend to add it.`))
      }
      return Promise.resolve({ status: 404, statusText: 'Not Found', headers: {}, data: {}, config })
    }

    const data = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8'))
    return Promise.resolve({ status: 200, statusText: 'OK', headers: {}, data, config })
  }

  return axios.create({ adapter })
}

module.exports = { FIXTURES_DIR, createFixtureAxios, fixtureName, normalize }

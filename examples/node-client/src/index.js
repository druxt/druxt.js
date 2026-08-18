'use strict'

const { DruxtClient } = require('druxt')
const { DruxtSchema } = require('druxt-schema')

/**
 * Creates the Druxt client instances the commands run against.
 *
 * Both `DruxtClient` and `DruxtSchema` are framework-agnostic: no Vue, no
 * Nuxt, plain Node. The axios injection point (`options.axios`) is how the
 * test suite swaps in a fixture-serving adapter - see test/adapter.js.
 *
 * @param {string} baseUrl - The Drupal backend base URL.
 * @param {object} [options] - Client options, passed through to DruxtClient
 *   and DruxtSchema (including an `axios` instance or adapter).
 *
 * @returns {{ druxt: DruxtClient, schema: DruxtSchema }} The clients.
 */
const createClients = (baseUrl, options = {}) => {
  if (!baseUrl) {
    throw new Error('No baseUrl. Use --baseUrl <url> or set DRUXT_BASE_URL.')
  }

  const druxt = new DruxtClient(baseUrl, options)
  druxt.settings = options

  return { druxt, schema: new DruxtSchema(baseUrl, options) }
}

module.exports = { createClients }

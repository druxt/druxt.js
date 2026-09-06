'use strict'

/**
 * The `types` command: list the JSON:API resource types exposed by the
 * backend, from the JSON:API index.
 *
 * The index links are keyed by resource type (`node--recipe`, ...); a few
 * non-resource links (`self`, `me`) are filtered out. When the backend has
 * the JSON:API Extras resource config enabled, index entries also carry
 * `entityType`/`bundle`/`resourceType` decoration, which is passed through.
 */

/**
 * Runs the `types` command.
 *
 * @param {{ druxt: object }} clients - The Druxt clients.
 *
 * @returns {object[]} Resource type entries, sorted by name:
 *   `{ type, href, entityType?, bundle? }`.
 */
const types = async ({ druxt }) => {
  const index = await druxt.getIndex()

  return Object.entries(index)
    .filter(([type]) => type.includes('--'))
    .map(([type, entry]) => ({
      type,
      href: entry.href,
      ...(entry.entityType ? { entityType: entry.entityType } : {}),
      ...(entry.bundle ? { bundle: entry.bundle } : {}),
      ...(entry.resourceType ? { resourceType: entry.resourceType } : {}),
    }))
    .sort((a, b) => (a.type < b.type ? -1 : a.type > b.type ? 1 : 0))
}

/**
 * Renders the `types` command result as a table.
 *
 * @param {object[]} data - The command result.
 *
 * @returns {string} The human-readable output.
 */
const renderTypes = (data) => {
  const width = Math.max(...data.map((o) => o.type.length))
  return [
    `${'RESOURCE TYPE'.padEnd(width)}  ENDPOINT`,
    `${'-'.repeat(width)}  ${'-'.repeat(8)}`,
    ...data.map((o) => `${o.type.padEnd(width)}  ${o.href}`),
    '',
    `${data.length} resource types`,
  ].join('\n')
}

module.exports = { renderTypes, types }

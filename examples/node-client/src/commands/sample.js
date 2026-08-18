'use strict'

/**
 * The `sample` command: fetch a few entities of a resource type, so the
 * shape of a resource's attributes can be inspected without hand-writing
 * JSON:API queries.
 */

/**
 * Picks a human label from a resource's attributes, across the common
 * Drupal base fields.
 *
 * @param {object} attributes - The resource attributes.
 *
 * @returns {string} The label, or '(no label)'.
 */
const labelOf = (attributes) =>
  attributes.title || attributes.name || attributes.label || attributes.info || attributes.display_name || '(no label)'

/**
 * Runs the `sample` command.
 *
 * @param {{ druxt: object }} clients - The Druxt clients.
 * @param {string} resourceType - The JSON:API resource type (`node--recipe`).
 * @param {object} [options] - Command options.
 * @param {number} [options.limit=3] - Number of entities to fetch.
 *
 * @returns {object} `{ resourceType, count, entities: [{ id, langcode, label }] }`.
 */
const sample = async ({ druxt }, resourceType, { limit = 3 } = {}) => {
  const collection = await druxt.getCollection(
    resourceType,
    { [`page[limit]`]: limit, [`fields[${resourceType}]`]: 'drupal_internal__id,title,name,label,info,display_name,langcode' },
  )

  return {
    resourceType,
    count: collection.data.length,
    entities: collection.data.map((entity) => ({
      id: entity.id,
      langcode: (entity.attributes || {}).langcode || null,
      label: labelOf(entity.attributes || {}),
    })),
  }
}

/**
 * Renders the `sample` command result as a table.
 *
 * @param {object} data - The command result.
 *
 * @returns {string} The human-readable output.
 */
const renderSample = (data) => {
  const idWidth = Math.max(36, ...data.entities.map((o) => o.id.length))
  return [
    `${'UUID'.padEnd(idWidth)}  LANG   LABEL`,
    `${'-'.repeat(idWidth)}  ----   ${'-'.repeat(5)}`,
    ...data.entities.map((o) => `${o.id.padEnd(idWidth)}  ${String(o.langcode).padEnd(5)}  ${o.label}`),
    '',
    `${data.count} of ${data.resourceType} (page 1)`,
  ].join('\n')
}

module.exports = { labelOf, renderSample, sample }

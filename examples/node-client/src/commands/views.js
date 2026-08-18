'use strict'

/**
 * The `views` command: list the Views exposed by the backend.
 *
 * The JSON:API Views module exposes View config entities as the `view--view`
 * collection, whose attributes include each view's machine name, label, and
 * the display plugin configuration keyed by display id. View *results* are
 * separately addressable at `jsonapi/views/<viewId>/<displayId>` (which is
 * exactly the convention DruxtClient's `getResource('views--<id>', '<display>')`
 * falls back to when the index has no entry) - the DISPLAYS column tells you
 * what's available to query.
 */

/**
 * Runs the `views` command.
 *
 * @param {{ druxt: object }} clients - The Druxt clients.
 *
 * @returns {object} `{ count, views: [{ id, label, description, status, displays }] }`.
 */
const views = async ({ druxt }) => {
  const collection = await druxt.getCollectionAll('view--view', { 'page[limit]': 100 })

  const entities = collection.flatMap((page) => page.data)

  return {
    count: entities.length,
    views: entities
      .map((entity) => {
        const attributes = entity.attributes || {}
        const display = attributes.display || {}
        return {
          id: attributes.drupal_internal__id || entity.id,
          label: attributes.label || '(no label)',
          description: attributes.description || '',
          status: !!attributes.status,
          displays: Object.keys(display).sort(),
        }
      })
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
  }
}

/**
 * Renders the `views` command result as a table.
 *
 * @param {object} data - The command result.
 *
 * @returns {string} The human-readable output.
 */
const renderViews = (data) => {
  const idWidth = Math.max(4, ...data.views.map((o) => o.id.length))
  return [
    `${'VIEW'.padEnd(idWidth)}  LABEL`,
    `${'-'.repeat(idWidth)}  ${'-'.repeat(5)}`,
    ...data.views.map((o) => `${o.id.padEnd(idWidth)}  ${o.label}\n${''.padEnd(idWidth)}  displays: ${o.displays.join(', ')}`),
    '',
    `${data.count} views`,
  ].join('\n')
}

module.exports = { renderViews, views }

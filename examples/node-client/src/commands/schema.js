'use strict'

/**
 * The `schema` command: print the Druxt schemas for a resource type and
 * display mode.
 *
 * `DruxtSchema.get()` builds schemas for every enabled entity display on the
 * backend, keyed by schema id: `<entityType>--<bundle>--<mode>--<schemaType>`
 * where schemaType is `view` or `form`. This command fetches them all once,
 * then selects the two that match the requested resource type and mode.
 */

/**
 * Runs the `schema` command.
 *
 * @param {{ schema: object }} clients - The Druxt clients.
 * @param {string} resourceType - The JSON:API resource type (`node--recipe`).
 * @param {object} [options] - Command options.
 * @param {string} [options.mode=default] - The display mode.
 *
 * @returns {object} `{ resourceType, mode, view, form, available }` where
 *   `view`/`form` are the matching schemas (or null) and `available` lists
 *   every schema id for the resource type (useful when the mode doesn't
 *   exist).
 */
const schema = async ({ schema: schemaClient }, resourceType, { mode = 'default' } = {}) => {
  if (!/^[a-z_]+--[a-z_]+$/i.test(resourceType || '')) {
    throw new Error(`Invalid resource type '${resourceType}'. Expected the format 'entityType--bundle', e.g. 'node--recipe'.`)
  }

  const { schemas } = await schemaClient.get()
  const prefix = `${resourceType}--`
  const matching = Object.keys(schemas).filter((id) => id.startsWith(prefix)).sort()

  return {
    resourceType,
    mode,
    view: schemas[`${resourceType}--${mode}--view`] || null,
    form: schemas[`${resourceType}--${mode}--form`] || null,
    available: matching,
  }
}

/**
 * Renders the `schema` command result: each found schema as JSON, or hints
 * at the available modes when nothing matched.
 *
 * @param {object} data - The command result.
 *
 * @returns {string} The human-readable output.
 */
const renderSchema = (data) => {
  const parts = []
  for (const schemaType of ['view', 'form']) {
    const value = data[schemaType]
    if (value) {
      parts.push(`# ${data.resourceType} -- ${data.mode} (${schemaType})\n${JSON.stringify(value, null, 2)}`)
    }
  }

  if (!parts.length) {
    const modes = data.available.map((id) => id.split('--')[2]).filter((m, i, a) => a.indexOf(m) === i)
    return `No ${data.mode} schema for ${data.resourceType}.` +
      (modes.length ? `\nAvailable modes: ${modes.join(', ')}` : `\nNo schemas at all for ${data.resourceType}.`)
  }

  return parts.join('\n\n')
}

module.exports = { renderSchema, schema }

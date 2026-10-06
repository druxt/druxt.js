import { DruxtSchema } from './schema'
import { schemaHandler } from './server-middleware/schema'
import { createHold } from './utils/hold'

/**
 * Schema refresh for any Node server.
 *
 * Returns a Connect handler for `/_druxt/schema`, the schema getter it uses, and a
 * clear for when Drupal's configuration changes. Generation uses the given access
 * without the API proxy, as the build does.
 *
 * @example @lang js
 * const schemas = createSchemaRefresh('https://example.com')
 * // Serve GET /_druxt/schema/<id>, with the path after /_druxt/schema as req.url.
 * schemas.handler(req, res)
 * // Where the server handles Drupal's purge.
 * schemas.clear()
 *
 * @param {string} baseUrl - The Drupal base URL.
 * @param {object} [options] - DruxtSchema options, such as `endpoint` and `schema.filter`.
 * @param {object} [settings] - Refresh settings.
 * @param {boolean} [settings.hold=true] - Hold schemas until a clear. Off, each call regenerates.
 *
 * @returns {{ getSchema: Function, handler: Function, clear: Function }}
 */
export const createSchemaRefresh = (baseUrl, options = {}, { hold = true } = {}) => {
  // A new generator for each clear, as a generator keeps the configuration it has read.
  const createDruxtSchema = () => new DruxtSchema(baseUrl, {
    ...options,
    proxy: { ...options.proxy || {}, api: false },
  })
  // A hold per refresh, so refreshes for different sites never share schemas.
  const held = createHold(createDruxtSchema)
  const getSchema = hold ? held.get : (id) => createDruxtSchema().getSchemaById(id)

  return { getSchema, handler: schemaHandler(getSchema), clear: held.clear }
}

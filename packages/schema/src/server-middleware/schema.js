import { parseSchemaId } from '../utils/hold'

/**
 * Server middleware that serves a schema regenerated from Drupal.
 *
 * Mounted at `/_druxt/schema`, it answers `GET /_druxt/schema/<id>`. It serves
 * only what the build already puts in the browser bundle as schema files.
 *
 * @param {Function} getSchema - Returns a promise of the schema for an ID, or of false when there is none.
 *
 * @returns {Function} A Connect handler.
 */
export const schemaHandler = (getSchema) => async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    return res.end()
  }

  let id
  try {
    id = decodeURIComponent(String(req.url || '').split('?')[0].replace(/^\/+/, ''))
  } catch (err) {
    id = ''
  }
  if (!parseSchemaId(id)) {
    res.statusCode = 404
    return res.end()
  }

  let schema
  try {
    schema = await getSchema(id)
  } catch (err) {
    res.statusCode = 502
    return res.end()
  }

  if (!schema) {
    // Tells a browser that Drupal has no such schema, as against a host without this route.
    res.statusCode = 404
    res.setHeader('X-Druxt-Schema', 'missing')
    return res.end()
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  // A schema changes with each clear, so the browser must not keep its own copy.
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(schema))
}

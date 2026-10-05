/* global globalThis */
// Schemas regenerated on the server, held until the next cache clear.
// Held on globalThis so every copy of this module in the process shares them.
const HOLD = Symbol.for('druxt.schemaHold')
const hold = globalThis[HOLD] || (globalThis[HOLD] = { generation: undefined, generator: null, schemas: new Map(), pending: new Map() })

// The generation druxt moves on each cache clear, shared through the same symbol.
const GENERATION = Symbol.for('druxt.processCacheGeneration')
const clears = () => (globalThis[GENERATION] || { value: 0 }).value

/**
 * The parts of a schema ID, `<entity type>--<bundle>--<mode>--<view|form>`.
 *
 * @param {string} id - The schema ID.
 *
 * @returns {object|boolean} The entity type, bundle, mode and schema type, or false for any other string.
 */
export const parseSchemaId = (id) => {
  const match = /^([a-z0-9_]+)--([a-z0-9_]+)--([a-z0-9_]+)--(view|form)$/.exec(String(id))
  if (!match) return false
  const [, entityType, bundle, mode, schemaType] = match
  return { entityType, bundle, mode, schemaType }
}

/**
 * Get a schema regenerated from Drupal, held until the next cache clear.
 *
 * Each clear starts a new generator, as a generator keeps the configuration it
 * has read. Concurrent calls for one ID share one generation. A schema generated
 * across a clear is returned to its callers but not held. A failed or empty
 * generation is not held, so the next call tries again.
 *
 * @param {Function} createDruxtSchema - Returns a new schema generator.
 * @param {string} id - The schema ID.
 *
 * @returns {Promise<object|boolean>} The schema, or false when Drupal has no such display.
 */
export const getHeldSchema = (createDruxtSchema, id) => {
  const now = clears()
  if (hold.generation !== now) {
    hold.schemas.clear()
    hold.pending.clear()
    hold.generator = null
    hold.generation = now
  }

  if (hold.schemas.has(id)) return Promise.resolve(hold.schemas.get(id))

  if (!hold.pending.has(id)) {
    if (!hold.generator) hold.generator = createDruxtSchema()
    const request = hold.generator.getSchemaById(id)
      .then((schema) => {
        if (schema && hold.generation === now && clears() === now) hold.schemas.set(id, schema)
        return schema
      })
      .finally(() => {
        if (hold.pending.get(id) === request) hold.pending.delete(id)
      })
    hold.pending.set(id, request)
  }

  return hold.pending.get(id)
}

/**
 * Empties the held schemas. For tests; a cache clear does this in production.
 */
export const resetSchemaHold = () => {
  hold.schemas.clear()
  hold.pending.clear()
  hold.generator = null
  hold.generation = undefined
}

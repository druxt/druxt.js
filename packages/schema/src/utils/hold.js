/* global globalThis */
// The generation druxt moves on each cache clear, shared across module copies through this symbol.
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
 * A hold for schemas regenerated from one Drupal site, kept until the next cache clear.
 *
 * Each hold has its own schemas and generator, so refreshes for different sites
 * never share them. Each clear starts a new generator, as a generator keeps the
 * configuration it has read. Concurrent calls for one ID share one generation.
 * A schema generated across a clear is returned to its callers but not held. A
 * failed or empty generation is not held, so the next call tries again.
 *
 * @param {Function} createDruxtSchema - Returns a new schema generator for the site.
 *
 * @returns {{ get: Function, clear: Function }} `get(id)` resolves to the schema, or false when Drupal has none; `clear()` empties the hold.
 */
export const createHold = (createDruxtSchema) => {
  const hold = { generation: undefined, generator: null, schemas: new Map(), pending: new Map() }

  const clear = () => {
    hold.schemas.clear()
    hold.pending.clear()
    hold.generator = null
    hold.generation = undefined
  }

  const get = (id) => {
    const now = clears()
    if (hold.generation !== now) {
      clear()
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

  return { get, clear }
}

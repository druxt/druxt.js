// The router base, which prefixes server middleware paths.
let base = '/'

// Drupal has no such schema, so the built one is out of date too.
const MISSING = {}

/**
 * A schema regenerated since the last cache clear, MISSING when Drupal has none,
 * or null to use the built file.
 *
 * @param {string} id - The Druxt.js Schema ID.
 * @returns {Promise<object|null>}
 */
<% if ((options.schema || {}).refresh) { %>
const refreshed = async (id) => {
  try {
    if (process.server) {
      // The module registers the refresh under the base URL the server starts
      // with, which can differ from the one the app was built with, as when a
      // container builds against one host and runs against another. One refresh
      // in the process is this app's; with several, only the built base URL decides.
      const refreshes = process[Symbol.for('druxt.schemaRefresh')] || new Map()
      const refresh = refreshes.get(<%= JSON.stringify(options.baseUrl) %>) ||
        (refreshes.size === 1 ? refreshes.values().next().value : undefined)
      const schema = refresh ? await refresh(id) : null
      return schema === false ? MISSING : schema || null
    }
    const res = await fetch(`${base}_druxt/schema/${encodeURIComponent(id)}`)
    if (res.ok) return await res.json()
    return res.headers.get('X-Druxt-Schema') === 'missing' ? MISSING : null
  } catch (err) {
    return null
  }
}
<% } else { %>
const refreshed = async () => null
<% } %>

/**
 * A schema, regenerated where available, else as built.
 *
 * @param {string} id - The Druxt.js Schema ID.
 * @returns {Promise<object>}
 */
const load = async (id) => {
  const schema = await refreshed(id)
  if (schema === MISSING) throw new Error(`No Druxt schema ${id} in Drupal.`)
  return schema || import(`./schemas/${id}.json`).then(m => m.default || m)
}

/**
 * Nuxt.js plugin for Druxt.js Schema.
 */
const DruxtSchemaPlugin = {
  /**
   * Import a generated Druxt.js Schema by ID.
   *
   * @param {string} id - The Druxt.js Schema ID.
   * @returns {Schema} The generated Druxt.js Schema object.
   *
   * @example @lang js
   * const schema = await this.$druxtSchema.import('node--page--default--view')
   */
  import: async id => {
    return load(id)
      .catch(async (err) => {
        const parts = id.split('--')

        // Error if there's no default view mode.
        if (parts[parts.length - 2] === 'default') throw err

        // Fallback to the default view mode.
        parts[parts.length - 2] = 'default'
        return load(parts.join('--'))
      })
  }
}

export default (context, inject) => {
  base = (((context.app || {}).router || {}).options || {}).base || '/'
  if (!base.endsWith('/')) base += '/'
  inject('druxtSchema', DruxtSchemaPlugin)
}

/**
 * @typedef {object} Schema
 * @see {@link ./typedefs/schema|Schema}
 */

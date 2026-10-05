// The router base, which prefixes server middleware paths.
let base = '/'

/**
 * A schema regenerated since the last cache clear, or false to use the built file.
 *
 * @param {string} id - The Druxt.js Schema ID.
 * @returns {Promise<object|boolean>}
 */
<% if ((options.schema || {}).refresh) { %>
const refreshed = async (id) => {
  try {
    if (process.server) {
      const refresh = process[Symbol.for('druxt.schemaRefresh')]
      return (refresh && await refresh(id)) || false
    }
    const res = await fetch(`${base}_druxt/schema/${encodeURIComponent(id)}`)
    return res.ok ? await res.json() : false
  } catch (err) {
    return false
  }
}
<% } else { %>
const refreshed = async () => false
<% } %>

/**
 * A schema, regenerated where available, else as built.
 *
 * @param {string} id - The Druxt.js Schema ID.
 * @returns {Promise<object>}
 */
const load = async (id) => (await refreshed(id)) || import(`./schemas/${id}.json`).then(m => m.default || m)

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

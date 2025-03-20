<% const { isNuxt2 } = options; delete options.isNuxt2 %>

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
  import: async (id) => {
    const getFallback = (id) => {
      const parts = id.split('--')
      // Error if there's no default view mode.
      if (parts[parts.length - 2] === 'default') throw new Error('Error: No schema file found for the provided ID: ' + id + '.')

      // Fallback to the default view mode.
      parts[parts.length - 2] = 'default'
      return parts.join('--')
    }

  <% if (typeof isNuxt2 === 'function' && isNuxt2()) { %>
    return import(`./schemas/${id}.json`)
      .then(m => m.default || m)
      .catch(async (err) => {
        const fallback = getFallback(id)
        return import(`./schemas/${fallback}.json`).then(m => m.default || m)
      })
<% } else { %>
  const schemas = import.meta.glob('#build/schemas/*.json')
  if (schemas['/.nuxt/schemas/' + id + '.json']) return schemas['/.nuxt/schemas/' + id + '.json']()
    const fallback = getFallback(id)
    return schemas['/.nuxt/schemas/' + fallback + '.json']()
<% } %>
  }
}

<% if (typeof isNuxt2 === 'function' && isNuxt2()) { %>
// Druxt Plugin for Nuxt 2.
export default (context, inject) => {
  inject('druxtSchema', DruxtSchemaPlugin)
}
<% } else { %>
// Druxt Plugin for Nuxt 3.
export default defineNuxtPlugin((app) => {
  return {
    provide: {
      druxtSchema: DruxtSchemaPlugin
    }
  }
})
<% } %>

/**
 * @typedef {object} Schema
 * @see {@link ./typedefs/schema|Schema}
 */

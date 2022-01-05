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
    return import(`./schemas/${id}.json`)
      .then(m => m.default || m)
      .catch(async (err) => {
        const parts = id.split('--')

        // Error if there's no default view mode.
        if (parts[parts.length - 2] === 'default') return err

        // Fallback to the default view mode.
        parts[parts.length - 2] = 'default'
        return import(`./schemas/${parts.join('--')}.json`).then(m => m.default || m)
      })
  }
}

export default (context, inject) => {
  inject('druxtSchema', DruxtSchemaPlugin)
}

/**
 * @typedef {object} Schema
 * @see {@link ./typedefs/schema|Schema}
 */

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
  import: async id => import(`./schemas/${id}.json`).then(m => m.default || m)
}

export default (context, inject) => {
  inject('druxtSchema', DruxtSchemaPlugin)
}

/**
 * @typedef {object} Schema
 * @see {@link ./typedefs/schema|Schema}
 */

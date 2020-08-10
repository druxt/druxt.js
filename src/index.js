import { DruxtSchemaModule } from './module'

/**
 * The core module functionality.
 *
 * Provides methods for generating Druxt.js Schema files from the Drupal JSON:API.
 *
 * @type class
 * @exports DruxtSchema
 * @see {@link ./schema|DruxtSchema}
 *
 * @example @lang js
 * import { DruxtSchema } from 'druxt-schema'
 * const druxtSchema = new DruxtSchema('https://example.com', {})
 */
export { DruxtSchema } from './schema'

/**
 * Vue.js Mixin.
 *
 * Adds required props and methods for lazy-loaded Schema support to custom Vue.js components.
 *
 * @exports DruxtSchemaMixin
 * @type {object}
 * @see {@link ./mixins/schema|DruxtSchemaMixin}
 *
 * @example @lang vue
 * <script>
 * import { DruxtSchemaMixin } from 'druxt-schema'
 *
 * export default {
 *   name: 'CustomComponent',
 *   mixins: [DruxtSchemaMixin]
 * }
 * </script>
 */
export { DruxtSchemaMixin } from './mixins/schema'

/**
 * The Vuex store module.
 *
 * Contains actions for interacting with and caching the generated Schema files.
 *
 * @exports DruxtSchemaStore
 * @type {Function}
 * @see {@link ./store/schema|DruxtSchemaStore}
 */
export { DruxtSchemaStore } from './stores/schema'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt.js frontend.
 *
 * @type {Function}
 * @exports default
 * @name DruxtSchemaModule
 * @see {@link ./module|DruxtSchemaModule}
 * 
 * @example <caption>nuxt.config.js</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt-schema'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://example.com'
 *   }
 * }
 */
export default DruxtSchemaModule

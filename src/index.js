import { DruxtEntityModule } from './module'
import * as DruxtEntityComponents from './components'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt.js frontend.
 *
 * @type {Function}
 * @exports default
 * @name DruxtEntityModule
 * @see {@link ./module|DruxtEntityModule}
 *
 * @example <caption>nuxt.config.js</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt-entity'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://example.com'
 *   }
 * }
 */
export default DruxtEntityModule

/**
 * Vue.js components.
 *
 * @type {object}
 * @exports DruxtEntityComponents
 * @name DruxtEntityComponents
 */
export { DruxtEntityComponents }
export * from './components'

/**
 * Component Suggestion mixin.
 *
 * Provides a mechanism for rendering custom Vue.js components for targetted theming.
 *
 * @type {object}
 * @see {@link ./mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
 * @exports DruxtEntityComponentSuggestionMixin
 * @name DruxtEntityComponentSuggestionMixin
 */
/**
 * Context mixin.
 *
 * Provides a context passthrough mechanism for Vue.js components.
 *
 * @type {object}
 * @see {@link ./mixins/context|DruxtEntityContextMixin}
 * @name DruxtEntityContextMixin
 * @exports DruxtEntityContextMixin
 */
/**
 * Entity mixin.
 *
 * Provides Vue.js properties to render a Drupal Entity JSON:API resource component.
 *
 * @type {object}
 * @see {@link ./mixins/entity|DruxtEntityMixin}
 * @name DruxtEntityMixin
 * @exports DruxtEntityMixin
 */
/**
 * Field mixin.
 *
 * Provides Vue.js properties to render Drupal Field components.
 *
 * @type {object}
 * @see {@link ./mixins/field|DruxtFieldMixin}
 * @name DruxtFieldMixin
 * @exports DruxtFieldMixin
 */
export * from './mixins'

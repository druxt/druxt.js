/**
 * @file Vue.js mixins for the DruxtEntity module.
 *
 * A mixin adds reusable props and logic to a Vue.js component, similar to a
 * PHP trait in Drupal.
 *
 * @see {@link https://v2.vuejs.org/v2/guide/mixins.html|Vue.js mixins}
 */

export * from './context.js'
export * from './componentSuggestion.js'

/**
 * Vue.js mixin for DruxtEntity and DruxtEntityForm Wrapper components.
 *
 * @type {object}
 * @exports DruxtEntityMixin
 * @see {@link ./entity|DruxtEntityMixin}
 */
export { DruxtEntityMixin } from './entity'

/**
 * Vue.js mixin for DruxtField Wrapper components.
 *
 * @type {object}
 * @exports DruxtFieldMixin
 * @see {@link ./field|DruxtFieldMixin}
 */
export { DruxtFieldMixin } from './field'

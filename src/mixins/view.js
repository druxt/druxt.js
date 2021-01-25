import { DruxtEntityContextMixin } from 'druxt-entity'

/**
 * Provides Vue.js properties to render Drupal Views components.
 *
 * This Mixin is intended for use by `view` type Component Suggestions for
 * targetted theming of Drupal Views.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * // Import mixin.
 * import { DruxtViewsViewMixin } from 'druxt-views'
 *
 * export default {
 *   // Register mixin.
 *   mixins: [DruxtViewsViewMixin],
 * }
 * </script>
 *
 * @see {@link https://entity.druxtjs.org/api/mixins/componentSuggestion.html|DruxtEntityComponentSuggestionMixin}
 */
const DruxtViewsViewMixin = {
  /**
   * Vue.js mixins.
   * @see {@link https://entity.druxtjs.org/api/mixins/context.html|DruxtEntityContextMixin}
   * @type {object[]}
   */
  mixins: [DruxtEntityContextMixin],

  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The View display object.
     *
     * @type {object}
     */
    display: {
      type: Object,
      require: true,
    },

    /**
     * The JSON:API Views results.
     *
     * @type {object[]}
     */
    results: {
      type: Array,
      require: true,
    },

    /**
     * The JSON:API View resource.
     *
     * @type {object}
     */
    view: {
      type: Object,
      require: true,
    },
  }
}

export { DruxtViewsViewMixin }

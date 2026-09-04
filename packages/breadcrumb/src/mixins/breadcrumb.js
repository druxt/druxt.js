/**
 * Provides Vue.js properties to render Drupal Breadcrumb component.
 *
 * @mixin
 *
 * @example @lang vue
 * <script>
 * import { DruxtBreadcrumbMixin } from 'druxt-breadcrumb'
 *
 * export default {
 *   mixins: [DruxtBreadcrumbMixin],
 * }
 * </script>
 */
const DruxtBreadcrumbMixin = {
  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The Breadcrumbs; an array of objects with `text` and optional `to` properties.
     *
     * @type {object[]}
     */
    crumbs: {
      type: Array,
      require: true,
    },

    /**
     * The JSON:API resource language code.
     *
     * @type {string}
     */
    langcode: {
      type: String,
      default: undefined,
    }
  },
}

export { DruxtBreadcrumbMixin }

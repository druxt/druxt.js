/**
 * Vue.js Mixin.
 *
 * Registers props for use by Druxt slot theme components.
 *
 * A mixin adds reusable props and logic to a Vue component, similar to a PHP
 * trait in Drupal development.
 *
 * @type {object}
 * @exports DruxtSiteMixin
 * @see {@link ./site|DruxtSiteMixin}
 * @see {@link https://v2.vuejs.org/v2/guide/mixins.html|Vue.js Mixins}
 * @example @lang vue
 * <template>
 *   <div>
 *     <slot v-for="region of regions" :key="region" :name="region" />
 *   </div>
 * </template>
 *
 * <script>
 * import { DruxtSiteMixin } from 'druxt-site'
 *
 * export default {
 *   mixins: [DruxtSiteMixin],
 * }
 * </script>
 */
 export { DruxtSiteMixin } from './site'

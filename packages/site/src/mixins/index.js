/**
 * Vue.js Mixin.
 *
 * Registers props for use by Druxt slot theme components.
 *
 * @type {object}
 * @exports DruxtSiteMixin
 * @see {@link ./mixins/site|DruxtSiteMixin}
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

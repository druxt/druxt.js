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
export { DruxtSiteMixin } from './mixins/site'

/**
 * Default function to alert user to incorrectly installed module.
 *
 * This was added as part of the @nuxt/kit update due to breaking changes.
 */
export default () => {
  throw new Error("DruxtSite Nuxt module must be installed as 'druxt-site/nuxt'")
}

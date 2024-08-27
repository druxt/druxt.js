/**
 * Vue.js Mixin.
 *
 * @type {object}
 * @exports DruxtBreadcrumbMixin
 * @see {@link ./mixins/breadcrumb|DruxtBreadcrumbMixin}
 */
 export { DruxtBreadcrumbMixin } from './mixins/breadcrumb'

/**
 * Default function to alert user to incorrectly installed module.
 *
 * This was added as part of the @nuxt/kit update due to breaking changes.
 */
export default () => {
  throw new Error("DruxtBreadcrumb Nuxt module must be installed as 'druxt-breadcrumb/nuxt'")
}

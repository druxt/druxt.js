import { DruxtBreadcrumbModule } from './nuxtModule'

/**
 * The Nuxt.js module function.
 *
 * Installs the DruxtBreadcrumb component and the Druxt and DruxtRouter
 * dependencies in a Nuxt.js frontend.
 *
 * @type {Function}
 * @exports default
 * @name DruxtBreadcrumbModule
 * @see {@link ./nuxtModule|DruxtBreadcrumbModule}
 * @see {@link https://druxtjs.org/modules/breadcrumb|Breadcrumb module guide}
 *
 * @example <caption>nuxt.config.js</caption> @lang js
 * export default {
 *   modules: [
 *     'druxt-breadcrumb'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://api.umami.demo.druxtjs.org'
 *   }
 * }
 */
export default DruxtBreadcrumbModule

/**
 * Vue.js mixin for DruxtBreadcrumb Wrapper components.
 *
 * Adds the `crumbs` and `langcode` props used to render a Drupal breadcrumb.
 *
 * @type {object}
 * @exports DruxtBreadcrumbMixin
 * @see {@link ./mixins/breadcrumb|DruxtBreadcrumbMixin}
 *
 * @example @lang vue
 * <script>
 * import { DruxtBreadcrumbMixin } from 'druxt-breadcrumb'
 * export default {
 *   mixins: [DruxtBreadcrumbMixin]
 * }
 * </script>
 */
 export { DruxtBreadcrumbMixin } from './mixins/breadcrumb'

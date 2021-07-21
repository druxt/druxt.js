import { DruxtBreadcrumbModule } from './module'
import * as DruxtBreadcrumbComponents from './components'
import { DruxtBreadcrumb, DruxtBlockSystemBreadcrumbBlock } from './components'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt.js frontend.
 *
 * @type {Function}
 * @exports default
 * @name DruxtBreadcrumbModule
 * @see {@link ./module|DruxtBreadcrumbModule}
 */
export default DruxtBreadcrumbModule

/**
 * Druxt.js Breadcrumb Vue.js component.
 *
 * @type {object}
 * @exports DruxtBreadcrumb
 * @name DruxtBreadcrumb
 * @see {@link ./components/DruxtBreadcrumb|DruxtBreadcrumb}
 */
export { DruxtBreadcrumb }

/**
 * DruxtBlockSystemBreadcrumbBlock component.
 *
 * @type {object}
 * @exports DruxtBlockSystemBreadcrumbBlock
 * @name DruxtBlockSystemBreadcrumbBlock
 * @see {@link ./components/blocks/DruxtBlockSystemBreadcrumbBlock|DruxtBlockSystemBreadcrumbBlock}
 */
export { DruxtBlockSystemBreadcrumbBlock }

export { DruxtBreadcrumbComponents }

/**
 * Vue.js Mixin.
 *
 * @type {object}
 * @exports DruxtBreadcrumbMixin
 * @see {@link ./mixins/breadcrumb|DruxtBreadcrumbMixin}
 */
export { DruxtBreadcrumbMixin } from './mixins/breadcrumb'

import { DruxtViewsModule } from './module'
import * as DruxtViewsComponents from './components'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt.js frontend.
 *
 * @type {Function}
 * @exports default
 * @name DruxtViewsModule
 * @see {@link ./module|DruxtViewsModule}
 */
export default DruxtViewsModule

/**
 * Vue.js components.
 *
 * @type {object}
 * @exports DruxtViewsComponents
 * @see {@link ./components/DruxtView|DruxtView}
 * @see {@link ./components/blocks/DruxtBlockViewsBlock|DruxtBlockViewsBlock}
 */
export { DruxtViewsComponents }
export * from './components'

/**
 * Vue.js Mixin.
 *
 * @type {object}
 * @exports DruxtViewsViewMixin
 * @see {@link ./mixins/view|DruxtViewsViewMixin}
 */
export { DruxtViewsViewMixin } from './mixins/view'

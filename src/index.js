import { DruxtViewsNuxtModule } from './nuxtModule'
import * as DruxtViewsComponents from './components'

/**
 * The NuxtJS module function.
 *
 * Installs the module functionality in a Nuxt application.
 *
 * @type {Function}
 * @exports default
 * @name DruxtViewsNuxtModule
 * @see {@link ./module|DruxtViewsNuxtModule}
 */
export default DruxtViewsNuxtModule

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

/**
 * Vuex store module.
 *
 * @type {object}
 * @exports DruxtViewsStore
 * @name DruxtViewsStore
 * @see {@link ./stores/views|DruxtViewsStore}
 */
export {DruxtViewsStore } from './stores/views'

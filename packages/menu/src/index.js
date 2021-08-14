import { DruxtMenuNuxtModule } from './nuxtModule'

/**
 * The DruxtMenu class.
 *
 * Core functionality for the DruxtMenu module.
 *
 * @type {class}
 * @exports DruxtMenu
 * @name DruxtMenu
 * @see {@link ./menu.html|DruxtMenu}
 */
export { DruxtMenu } from './menu.js'

/**
 * The DruxtMenu vuex store.
 *
 * @type {object}
 * @exports DruxtMenuStore
 * @name DruxtMenuStore
 * @see {@link ./stores/menu.html|DruxtMenuStore}
 */
export { DruxtMenuStore } from './stores/menu.js'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt application.
 *
 * @type {Function}
 * @exports default
 * @name DruxtMenuNuxtModule
 * @see {@link ./nuxtModule.html|DruxtMenuNuxtModule}
 */
export default DruxtMenuNuxtModule

/**
 * Vue.js Mixin.
 *
 * @type {object}
 * @exports DruxtMenuMixin
 * @see {@link ./mixins/menu|DruxtMenuMixin}
 */
export { DruxtMenuMixin } from './mixins/menu'

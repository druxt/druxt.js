/**
 * The DruxtMenu class.
 *
 * Core functionality for the DruxtMenu module.
 *
 * @type {class}
 * @exports DruxtMenu
 * @name DruxtMenu
 * @see {@link ./menu|DruxtMenu}
 */
export { DruxtMenu } from './menu.js'

/**
 * The DruxtMenu vuex store.
 *
 * @type {object}
 * @exports DruxtMenuStore
 * @name DruxtMenuStore
 * @see {@link ./stores/menu|DruxtMenuStore}
 */
export { DruxtMenuStore } from './stores/menu.js'

/**
 * Vue.js Mixin.
 *
 * @type {object}
 * @exports DruxtMenuMixin
 * @see {@link ./mixins/menu|DruxtMenuMixin}
 */
export { DruxtMenuMixin } from './mixins/menu'

/**
 * Default function to alert user to incorrectly installed module.
 *
 * This was added as part of the @nuxt/kit update due to breaking changes.
 */
export default () => {
  throw new Error("DruxtMenu Nuxt module must be installed as 'druxt-menu/nuxt'")
}

import { DruxtMenuModule } from './module'
import * as DruxtMenuComponents from './components'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt.js frontend.
 *
 * @type {Function}
 * @exports default
 * @name DruxtMenuModule
 * @see {@link ./module.html|DruxtMenuModule}
 */
export default DruxtMenuModule

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
 * Vue.js components.
 *
 * @type {object}
 * @exports DruxtMenuComponents
 * @name DruxtMenuComponents
 *
 * @see {@link ./components/DruxtMenu.html|DruxtMenu}
 * @see {@link ./components/DruxtMenuItem.html|DruxtMenuItem}
 * @see {@link ./components/blocks/DruxtBlockSystemMenuBlock.html|DruxtBlockSystemMenuBlock}
 */
export { DruxtMenuComponents }
export * from './components'

/**
 * The DruxtMenu vuex store.
 *
 * @type {object}
 * @exports DruxtMenuStore
 * @name DruxtMenuStore
 * @see {@link ./stores/menu.html|DruxtMenuStore}
 */
export { DruxtMenuStore } from './stores/menu.js'

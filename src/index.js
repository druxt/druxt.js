import { DruxtBlocksModule } from './module'
import * as DruxtBlocksComponents from './components'

/**
 * Druxt.js Blocks.
 *
 * @type {object}
 * @exports DruxtBlocksComponents
 * @see {@link ./components/blocks/DruxtBlockBlockContent|DruxtBlockBlockContent}
 * @see {@link ./components/blocks/DruxtBlockPageTitleBlock|DruxtBlockPageTitleBlock}
 * @see {@link ./components/blocks/DruxtBlockSystemMainBlock|DruxtBlockSystemMainBlock}
 */
export { DruxtBlocksComponents }
export * from './components'

/**
 * Vue.js Mixin.
 *
 * @type {object}
 * @exports DruxtBlocksBlockMixin
 * @see {@link ./mixins/block|DruxtBlocksBlockMixin}
 */
export { DruxtBlocksBlockMixin } from './mixins/block'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt.js frontend.
 *
 * @type {Function}
 * @exports default
 * @name DruxtBlocksModule
 * @see {@link ./module|DruxtBlocksModule}
 *
 * @example <caption>nuxt.config.js</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt-blocks'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://example.com'
 *   }
 * }
 */
export default DruxtBlocksModule

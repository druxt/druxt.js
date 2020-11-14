import { DruxtBlocksNuxtModule } from './nuxtModule'
import * as DruxtBlocksComponents from './components'

/**
 * DruxtJS Blocks.
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
 * The NuxtJS module function.
 *
 * Installs the module functionality in a Nuxt application.
 *
 * @type {Function}
 * @exports default
 * @name DruxtBlocksModule
 * @see {@link ./nuxtModule|DruxtBlocksModule}
 *
 * @example <caption>nuxt.config.js</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt-blocks'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://demo-api.druxtjs.org'
 *   }
 * }
 */
export default DruxtBlocksNuxtModule

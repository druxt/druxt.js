import { DruxtBlocksNuxtModule } from './nuxtModule'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt application.
 *
 * @type {Function}
 * @exports default
 * @name DruxtBlocksModule
 * @see {@link /api/packages/blocks/nuxtModule|DruxtBlocksModule}
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

/**
 * The DruxtBlocksBlockMixin adds props and computed props to your DruxtBlock
 * wrapper component.
 *
 * @type {object}
 * @exports DruxtBlocksBlockMixin
 * @see {@link /api/packages/blocks/mixins/block|DruxtBlocksBlockMixin}
 *
 * @example @lang js
 * import { DruxtBlocksBlockMixin } from 'druxt-blocks'
 * export default {
 *   mixins: [DruxtBlocksBlockMixin]
 * }
 */
 export { DruxtBlocksBlockMixin } from './mixins/block'

/**
 * The DruxtBlocksRegionMixin adds props to your DruxtBlock wrapper component.
 *
 * @type {object}
 * @exports DruxtBlocksRegionMixin
 * @see {@link /api/packages/blocks/mixins/region|DruxtBlocksRegionMixin}
 *
 * @example @lang js
 * import { DruxtBlocksRegionMixin } from 'druxt-blocks'
 * export default {
 *   mixins: [DruxtBlocksRegionMixin]
 * }
 */
export { DruxtBlocksRegionMixin } from './mixins/region'

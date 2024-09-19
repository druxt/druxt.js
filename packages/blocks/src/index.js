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

/**
 * Default function to alert user to incorrectly installed module.
 *
 * This was added as part of the @nuxt/kit update due to breaking changes.
 */
export default () => {
  throw new Error("DruxtBlocks Nuxt module must be installed as 'druxt-blocks/nuxt'")
}

/**
 * @file Vue.js mixins for the DruxtBlocks module.
 *
 * A mixin adds reusable props and logic to a Vue.js component, similar to a
 * PHP trait in Drupal.
 *
 * @see {@link https://v2.vuejs.org/v2/guide/mixins.html|Vue.js mixins}
 */

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
export { DruxtBlocksBlockMixin } from './block'

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
export { DruxtBlocksRegionMixin } from './region'

<template>
  <DruxtBreadcrumb />
</template>

<script>
import { DruxtBlocksBlockMixin } from 'druxt-blocks'

/**
 * System Breadcrumb block.
 *
 * _This component is intended to be rendered by the `<druxt-block />` component._
 *
 * - Renders the `<druxt-breadcrumb />` component.
 *
 * @example @lang vue
 * <druxt-block
 *   uuid="59121e44-e21b-4f53-b009-5225cd630145"
 * />
 *
 * @see {@link https://blocks.druxtjs.org/api/components/DruxtBlock|DruxtBlock}
 * @see {@link ../DruxtBreadcrumb|DruxtBreadcrumb}
 */
export default {
  name: 'DruxtBlockSystemBreadcrumbBlock',

  /**
   * Vue.js Mixins.
   *
   * @see {@link https://blocks.druxtjs.org/api/mixins/block|DruxtBlocksBlockMixin}
   */
  mixins: [DruxtBlocksBlockMixin],
}
</script>

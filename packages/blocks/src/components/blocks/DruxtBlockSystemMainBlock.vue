<template>
  <div>
    <Nuxt />
  </div>
</template>

<script>
import { DruxtBlocksBlockMixin } from '../../mixins/block'

/**
 * System Main block.
 *
 * _This component is intended to be rendered by the `<DruxtBlock />` component._
 *
 * - Renders the `<Nuxt />` component.
 *
 * @example
 * <DruxtBlock
 *   uuid="c8861445-0b31-4bb3-9fc3-0163e73cfe25"
 * />
 *
 * @see {@link ../DruxtBlock|DruxtBlock}
 * @see {@link https://nuxtjs.org/guides/features/nuxt-components/#the-nuxt-component|Nuxt}
 */
export default {
  name: 'DruxtBlockSystemMainBlock',

  /**
   * Vue.js Mixins.
   *
   * @see {@link ../../mixins/DruxtBlocksBlockMixin|DruxtBlocksBlockMixin}
   */
  mixins: [DruxtBlocksBlockMixin],
}
</script>

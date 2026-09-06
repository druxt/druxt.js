<template>
  <h1>{{ title }}</h1>
</template>

<script>
import { mapState } from 'vuex'

import { DruxtBlocksBlockMixin } from 'druxt-blocks'

/**
 * Page Title block.
 *
 * _This component is intended to be rendered by the `<DruxtBlock />` component._
 *
 * - Renders the Page title using the DruxtJS Router label data.
 *
 * @example
 * <DruxtBlock
 *   uuid="59104acd-88e1-43c3-bd5f-35800f206394"
 * />
 *
 * @see {@link ../DruxtBlock|DruxtBlock}
 * @see {@link https://druxtjs.org/modules/router|DruxtJS Router}
 */
export default {
  name: 'DruxtBlockPageTitleBlock',

  /**
   * Vue.js Mixins.
   *
   * @see {@link /api/packages/blocks/mixins/block|DruxtBlocksBlockMixin}
   */
  mixins: [DruxtBlocksBlockMixin],

  /**
   * Vue.js Computed properties.
   *
   * @vue-computed {string} title The current Route title.
   */
  computed: {
    ...mapState('druxtRouter', {
      title: state => state.route.label
    })
  }
}
</script>

<template>
  <h1>{{ title }}</h1>
</template>

<script>
import { mapState } from 'vuex'

import { DruxtBlocksBlockMixin } from '../../mixins/block'

/**
 * Page Title block.
 *
 * _This component is intended to be rendered by the `<druxt-block />` component._
 *
 * - Renders the Page title using the Druxt.js Router label data.
 *
 * @example
 * <druxt-block
 *   uuid="59104acd-88e1-43c3-bd5f-35800f206394"
 * />
 *
 * @see {@link ../DruxtBlock|DruxtBlock}
 * @see {@link https://druxt.github.io/druxt-router|Druxt.js Router}
 */
export default {
  name: 'DruxtBlockPageTitleBlock',

  /**
   * Vue.js Mixins.
   *
   * @see {@link ../../mixins/DruxtBlocksBlockMixin|DruxtBlocksBlockMixin}
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

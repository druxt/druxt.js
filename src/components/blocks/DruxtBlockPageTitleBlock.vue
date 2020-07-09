<template>
  <h1>{{ title }}</h1>
</template>

<script>
import { mapState } from 'vuex'

import { DruxtBlocksBlockMixin } from '../../mixins/block'

export default {
  name: 'DruxtBlockPageTitleBlock',

  mixins: [DruxtBlocksBlockMixin],

  computed: {
    ...mapState('druxtRouter', {
      title: state => state.route.label
    })
  }
}
</script>

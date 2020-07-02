<template>
  <druxt-entity v-bind="props" />
</template>

<script>
import { DruxtBlocksBlockMixin } from '../../mixins/block'

export default {
  name: 'DruxtBlockBlockContent',

  mixins: [DruxtBlocksBlockMixin],

  computed: {
    props() {
      const parts = this.block.attributes.dependencies.content[0].split(':')

      return {
        type: `${parts[0]}--${parts[1]}`,
        uuid: parts[2]
      }
    }
  }
}
</script>

<template>
  <druxt-menu :name="name" />
</template>

<script>
import { DruxtBlocksBlockMixin } from 'druxt-blocks'

export default {
  name: 'DruxtBlockSystemMenuBlock',

  mixins: [DruxtBlocksBlockMixin],

  computed: {
    name() {
      return this.settings.id.split(':')[1]
    },
  },
}
</script>

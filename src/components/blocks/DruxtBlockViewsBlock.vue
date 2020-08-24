<template>
  <druxt-view v-if="props" v-bind="props" />
</template>

<script>
import { DruxtBlocksBlockMixin } from 'druxt-blocks'

export default {
  name: 'DruxtBlockViewsBlock',

  mixins: [DruxtBlocksBlockMixin],

  async fetch() {
    const query = {
      'filter[drupal_internal__id]': this.viewId,
      'fields[view--view]': 'id'
    }

    const router = this.$druxtRouter()
    const results = await this.$druxtRouter().getResources('view--view', query)
    this.uuid = results[0].id
  },

  data: () => ({
    uuid: false
  }),

  computed: {
    displayId() {
      return this.settings.id.match(/views_block\:(.*?)-(.*)/)[2]
    },

    props() {
      if (!this.uuid) return false

      const parts = this.settings.id.match(/views_block\:(.*?)-(.*)/)

      return {
        displayId: this.displayId,
        uuid: this.uuid,
        viewId: this.viewId
      }
    },

    viewId() {
      return this.settings.id.match(/views_block\:(.*?)-(.*)/)[1]
    },
  }
}
</script>
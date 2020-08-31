<template>
  <div>
    <druxt-view v-if="props" v-bind="props" />
  </div>
</template>

<script>
import { mapActions } from 'vuex'

import { DruxtBlocksBlockMixin } from 'druxt-blocks'

export default {
  name: 'DruxtBlockViewsBlock',

  mixins: [DruxtBlocksBlockMixin],

  async fetch() {
    await this.fetch()
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
  },

  created() {
    if (!this.$fetch) {
      this.fetch()
    }
  },

  methods: {
    async fetch() {
      const query = {
        'filter[drupal_internal__id]': this.viewId,
        'fields[view--view]': 'id'
      }

      const results = await this.getResources('view--view', query)
      this.uuid = results[0].id
    },

    /**
     * Maps `druxtRouter/getResources` Vuex action to `this.getResources`.
     */
    ...mapActions({
      getResources: 'druxtRouter/getResources'
    })
  }
}
</script>
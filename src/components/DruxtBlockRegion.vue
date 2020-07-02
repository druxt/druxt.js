<template>
  <component :is="component">
    <druxt-block
      v-for="block of blocks"
      :key="block.id"
      :uuid="block.id"
      type="block--block"
    />
  </component>
</template>

<script>
import { mapActions } from 'vuex'

import { DruxtEntityComponentSuggestionMixin } from 'druxt-entity'

export default {
  name: 'DruxtBlockRegion',

  mixins: [DruxtEntityComponentSuggestionMixin],

  props: {
    name: {
      type: String,
      default: 'content'
    },

    theme: {
      type: String,
      required: true
    },
  },

  data: () => ({
    blocks: []
  }),

  computed: {
    suggestionDefaults() {
      if (!this.tokens) return []

      return [
        // e.g. DruxtBlockRegionHeaderUmami
        { value: this.tokens.prefix + this.tokens.region + this.tokens.theme },
        // e.g. DruxtBlockRegionHeader
        { value: this.tokens.prefix + this.tokens.region },
      ]
    },

    tokens() {
      return {
        prefix: 'DruxtBlockRegion',
        region: this.suggest(this.name),
        theme: this.suggest(this.theme)
      }
    },

    tokenType: () => 'block-region'
  },

  created() {
    const query = {
      'filter[region]': this.name,
      'filter[theme]': this.theme,
      'filter[status]': 1
    }

    this.getResources({ resource: 'block--block', query }).then(blocks => this.blocks = blocks)
  },

  methods: {
    ...mapActions({
      getResources: 'druxtRouter/getResources'
    })
  }
}
</script>

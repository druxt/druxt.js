<template>
  <component :is="component" v-if="blocks">
    <druxt-block
      v-for="block of blocks"
      :key="block.id"
      :uuid="block.id"
      type="block--block"
    />
  </component>
</template>

<script>
import { stringify } from 'qs'
import { mapActions, mapState } from 'vuex'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

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
    blocks: [],
    loading: false
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

    tokenType: () => 'block-region',

    ...mapState('druxtRouter', {
      route: state => state.route
    })
  },

  watch: {
    route() {
      this.fetchBlocks()
    }
  },

  created() {
    this.fetchBlocks()
  },

  methods: {
    fetchBlocks() {
      if (this.loading) return

      this.loading = true
      const query = new DrupalJsonApiParams()
      query
        .addFilter('region', this.name)
        .addFilter('status', '1')
        .addFilter('theme', this.theme)
      const queryObject = query.getQueryObject()
      const querystring = stringify(queryObject)

      this.getResources({ resource: 'block--block', query: querystring }).then(blocks => {
        this.blocks = blocks
        this.loading = false
      })
    },

    ...mapActions({
      getResources: 'druxtRouter/getResources'
    })
  }
}
</script>

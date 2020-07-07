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
        .addGroup('visibility', 'OR')
        .addFilter('visibility.request_path', null, 'IS NULL', 'visibility')

      query.addGroup('pages', 'AND', 'visibility')
        .addFilter('visibility.request_path.pages', this.route.resolvedPath, 'CONTAINS', 'pages')
        .addFilter('visibility.request_path.negate', 0, '=', 'pages')

      query.addGroup('front', 'AND', 'visibility')
        .addFilter('visibility.request_path.pages', '<front>', 'CONTAINS', 'front')
        .addFilter('visibility.request_path.negate', this.route.isHomePath ? 0 : 1, '=', 'front')

      // 'drupal-jsonapi-params' incorrectly assigns NULL operator conditions a value.
      // We have to modify and stringify the query manually.
      // @SEE - https://github.com/d34dman/drupal-jsonapi-params/issues/7
      const queryObject = query.getQueryObject()
      delete queryObject.filter['visibility.request_path'].condition.value
      const querystring = stringify(queryObject)

      const options = {
        headers: { 'Druxt-Request-Path': this.$store.state.druxtRouter.route.resolvedPath }
      }

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

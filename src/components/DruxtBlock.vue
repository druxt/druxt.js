<template>
  <component :is="component" v-if="entity" v-bind="props" />
</template>

<script>
import { DruxtEntityComponentSuggestionMixin } from 'druxt-entity'
import { DruxtRouterEntityMixin } from 'druxt-router'

export default {
  name: 'DruxtBlock',

  mixins: [DruxtEntityComponentSuggestionMixin, DruxtRouterEntityMixin],

  props: {
    type: {
      type: String,
      default: 'block--block'
    }
  },

  computed: {
    props() {
      return {
        block: this.entity
      }
    },

    suggestionDefaults() {
      if (!this.tokens) return []

      return [
        // e.g. DruxtBlockSystemMenuBlockMainHeaderUmami
        { value: this.tokens.prefix + this.tokens.plugin + this.tokens.region + this.tokens.theme },
        // e.g. DruxtBlockSystemMenuBlockMainHeader
        { value: this.tokens.prefix + this.tokens.plugin + this.tokens.region },
        // e.g. DruxtBlockSystemMenuBlockMainUmami
        { value: this.tokens.prefix + this.tokens.plugin + this.tokens.theme },
        // e.g. DruxtBlockSystemMenuBlockMain
        { value: this.tokens.prefix + this.tokens.plugin },
      ]
    },

    tokens() {
      if (!this.entity) return false

      return {
        prefix: 'DruxtBlock',
        plugin: this.suggest(this.entity.attributes.plugin).replace(':', ''),
        region: this.suggest(this.entity.attributes.region),
        theme: this.suggest(this.entity.attributes.theme)
      }
    },

    tokenType: () => 'block-region'
  }
}
</script>

<template>
  <component
    :is="component"
    v-if="entity"
    v-bind="props"
  />
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
      const defaults = []
      if (!this.tokens) return defaults

      // e.g. DruxtBlockSystemMenuBlockMainHeaderUmami
      defaults.push(this.tokens.prefix + this.tokens.plugin + this.tokens.pluginId + this.tokens.region + this.tokens.theme)
      // e.g. DruxtBlockSystemMenuBlockHeaderUmami
      defaults.push(this.tokens.prefix + this.tokens.plugin + this.tokens.region + this.tokens.theme)
      // e.g. DruxtBlockSystemMenuBlockMainHeader
      defaults.push(this.tokens.prefix + this.tokens.plugin + this.tokens.pluginId + this.tokens.region)
      // e.g. DruxtBlockSystemMenuBlockHeader
      defaults.push(this.tokens.prefix + this.tokens.plugin + this.tokens.region)
      // e.g. DruxtBlockSystemMenuBlockMainUmami
      defaults.push(this.tokens.prefix + this.tokens.plugin + this.tokens.pluginId + this.tokens.theme)
      // e.g. DruxtBlockSystemMenuBlockUmami
      defaults.push(this.tokens.prefix + this.tokens.plugin + this.tokens.theme)
      // e.g. DruxtBlockSystemMenuBlockMain
      defaults.push(this.tokens.prefix + this.tokens.plugin + this.tokens.pluginId)
      // e.g. DruxtBlockSystemMenuBlock
      defaults.push(this.tokens.prefix + this.tokens.plugin)

      return defaults.filter((value, index, self) => self.indexOf(value) === index).map(item => ({ value: item }))
    },

    tokens() {
      if (!this.entity) return false

      const tokens = {
        prefix: 'DruxtBlock',
        plugin: this.suggest(this.entity.attributes.plugin),
        pluginId: '',
        region: this.suggest(this.entity.attributes.region),
        theme: this.suggest(this.entity.attributes.theme),
      }

      if (this.entity.attributes.plugin.includes(':')) {
        const parts = this.entity.attributes.plugin.split(':')
        tokens.plugin = this.suggest(parts[0])
        tokens.pluginId = this.suggest(parts[1])
      }

      return tokens
    },

    tokenType: () => 'block'
  }
}
</script>

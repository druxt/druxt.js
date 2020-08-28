<template>
  <div>
    <component
      :is="component"
      v-if="entity"
      v-bind="props"
    />
  </div>
</template>

<script>
import { DruxtEntityComponentSuggestionMixin } from 'druxt-entity'
import { DruxtRouterEntityMixin } from 'druxt-router'

/**
 * The `<druxt-block />` Vue.js component.
 *
 * - Loads the JSON:API Block resource from Drupal via the Druxt.js Router module.
 * - Renders the data via the Component Suggestion system.
 *
 * @example
 * <druxt-block
 *   uuid="59104acd-88e1-43c3-bd5f-35800f206394"
 * />
 */
export default {
  name: 'DruxtBlock',

  /**
   * Vue.js Mixins.
   *
   * @see {@link https://druxt.github.io/druxt-entity/api/mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
   * @see {@link https://druxt.github.io/druxt-router/api/mixins/entity|DruxtRouterEntityMixin}
   */
  mixins: [DruxtEntityComponentSuggestionMixin, DruxtRouterEntityMixin],

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * JSON:API Resource type.
     *
     * @type {string}
     * @default block--block
     */
    type: {
      type: String,
      default: 'block--block'
    }
  },

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * Properties to pass through to the resolved component suggestion.
     *
     * @type {object}
     *
     * @see {@link https://druxt.github.io/druxt-entity/api/mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
     */
    props() {
      return {
        block: this.entity
      }
    },

    /**
     * Default suggestions for the Component suggestion mixin.
     *
     * - **[Prefix][Plugin][Plugin ID][Region][Theme]**
     * - **[Prefix][Plugin][Region][Theme]**
     * - **[Prefix][Plugin][Plugin ID][Region]**
     * - **[Prefix][Plugin][Region]**
     * - **[Prefix][Plugin][Plugin ID][Theme]**
     * - **[Prefix][Plugin][Theme]**
     * - **[Prefix][Plugin][Plugin ID]**
     * - **[Prefix][Plugin]**
     *
     * @type {object[]}
     *
     * @see {@link https://druxt.github.io/druxt-entity/api/mixins/componentSuggestion.html|DruxtEntityComponentSuggestionMixin}
     *
     * @example @lang vue
     * <druxt-block uuid="59104acd-88e1-43c3-bd5f-35800f206394" />
     * <!--
     * Suggestions to be rendered by the DruxtBlock component:
     *   - DruxtBlockSystemMenuBlockMainHeaderUmami
     *   - DruxtBlockSystemMenuBlockHeaderUmami
     *   - DruxtBlockSystemMenuBlockMainHeader
     *   - DruxtBlockSystemMenuBlockHeader
     *   - DruxtBlockSystemMenuBlockMainUmami
     *   - DruxtBlockSystemMenuBlockUmami
     *   - DruxtBlockSystemMenuBlockMain
     *   - DruxtBlockSystemMenuBlock
     * -->
     */
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

    /**
     * Tokens for the Component suggestion mixin.
     *
     * - prefix
     * - plugin
     * - pluginId
     * - region
     * - theme
     *
     * @type {boolean|object}
     *
     * @see {@link https://druxt.github.io/druxt-entity/api/mixins/componentSuggestion.html|DruxtEntityComponentSuggestionMixin}
     */
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

    /**
     * Token type for DruxtEntityComponentSuggestionMixin.
     *
     * @type {string}
     * @default block
     *
     * @see {@link https://druxt.github.io/druxt-entity/api/mixins/componentSuggestion.html|DruxtEntityComponentSuggestionMixin}
     */
    tokenType: () => 'block'
  }
}
</script>

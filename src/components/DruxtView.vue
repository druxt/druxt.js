<template>
  <component
    :is="component"
    v-if="view && results"
    v-bind="props"
  >
    <template
      v-if="headers"
      v-slot:header
    >
      <span
        v-for="header of headers"
        :key="header.id"
        v-html="header.content.value"
      />
    </template>

    <template v-slot:default="options">
      <druxt-entity
        v-for="result of results"
        v-bind="{
          type: result.type,
          uuid: result.id,
          mode,
          ...options
        }"
        :key="result.id"
      />
    </template>
  </component>
</template>

<script>
import { mapActions } from 'vuex'

/**
 * The `<druxt-view />` Vue.js component.
 *
 * @todo Add example.
 */
export default {
  name: 'DruxtView',

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * The View Display ID.
     *
     * @type {string}
     * @default default
     */
    displayId: {
      type: String,
      default: 'default',
    },

    /**
     * JSON:API Resource type.
     *
     * @type {string}
     * @default view--view
     */
    type: {
      type: String,
      default: 'view--view'
    },

    /**
     * The View UUID.
     *
     * @type {string}
     */
    uuid: {
      type: String,
      required: true
    },

    /**
     * The View ID.
     *
     * @type {string}
     */
    viewId: {
      type: String,
      required: true
    }
  },

  /**
   * Nuxt.js fetch method.
   */
  async fetch() {
    await this.fetch()
  },

  /**
   * Vue.js Data object.
   *
   * Used for on-demand JSON:API resource loading.
   *
   * @property {object[]} results - The View results JSON:API resources.
   * @property {object} view - * The View JSON:API resource.
   */
  data: () => ({
    results: false,
    view: false
  }),

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * The render component.
     *
     * @type {string}
     *
     * @todo {@link https://github.com/druxt/druxt-views/issues/16|Add DruxtEntityComponentSuggestionMixin}
     */
    component() {
      for (const suggestion of this.suggestions) {
        if (typeof this.$options.components[suggestion] !== 'undefined') {
          return suggestion
        }
      }

      return 'div'
    },

    /**
     * The View Display object.
     *
     * @type {object}
     */
    display() {
      if (!this.view || !this.view.attributes) return false

      if (this.display_id === 'default') return this.view.attributes.display[this.display_id]

      return {
        ...this.view.attributes.display[this.displayId],
        ...this.view.attributes.display['default']
      }
    },

    /**
     * The View Headers data.
     *
     * @type {@object}
     */
    headers() {
      if (!this.display) return false

      return this.display.display_options.header
    },

    /**
     * The View mode for the results entities.
     *
     * @type {string}
     */
    mode() {
      if (!this.display) return false

      if (!this.display.display_options.row.type.includes('entity:')) return false

      return this.display.display_options.row.options.view_mode
    },

    /**
     * Properties to pass through to the resolved component suggestion.
     *
     * @type {object}
     */
    props() {
      if (this.component === 'div') return false

      return {
        view: this.view,
        results: this.results
      }
    },

    /**
     * Suggestions for render component.
     *
     * @type {object}
     */
    suggestions() {
      const suggestions = []

      const prefix = 'DruxtView'

      const viewId = this.viewId.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
      const displayId = this.displayId.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')

      suggestions.push(prefix + viewId + displayId)
      suggestions.push(prefix + viewId)

      return suggestions
    },
  },

  created() {
    // Workaround for Vuepress docs.
    if (!this.$fetch) {
      this.fetch()
    }
  },

  methods: {
    /**
     * Fetch requested View and results from Druxt.js Router.
     */
    async fetch() {
      const viewQuery = { type: this.type, id: this.uuid }
      this.view = await this.getResource(viewQuery)

      const resultsQuery = { type: `views--${this.viewId}`, id: this.displayId }
      this.results = await this.getResource(resultsQuery)
    },

    /**
     * Maps `druxtRouter/getEntity` Vuex action to `this.getResource`.
     */
    ...mapActions({
      getResource: 'druxtRouter/getEntity'
    })
  }
}
</script>

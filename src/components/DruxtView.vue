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

    <druxt-entity
      v-for="result of results"
      :key="result.id"
      :type="result.type"
      :uuid="result.id"
      :mode="mode"
    />
  </component>
</template>

<script>
export default {
  name: 'DruxtView',

  props: {
    displayId: {
      type: String,
      default: 'default',
    },

    type: {
      type: String,
      default: 'view--view'
    },

    uuid: {
      type: String,
      required: true
    },

    viewId: {
      type: String,
      required: true
    }
  },

  data: () => ({
    results: false,
    view: false
  }),

  computed: {
    component() {
      for (const suggestion of this.suggestions) {
        if (typeof this.$options.components[suggestion] !== 'undefined') {
          return suggestion
        }
      }

      return 'div'
    },

    display() {
      if (!this.view || !this.view.attributes) return false

      if (this.display_id === 'default') return this.view.attributes.display[this.display_id]

      return {
        ...this.view.attributes.display[this.displayId],
        ...this.view.attributes.display['default']
      }
    },

    headers() {
      if (!this.display) return false

      return this.display.display_options.header
    },

    mode() {
      if (!this.display) return false

      return this.display.display_options.row.options.view_mode
    },

    props() {
      if (this.component === 'div') return false

      return {
        view: this.view,
        results: this.results
      }
    },

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
    const viewQuery = { type: this.type, id: this.uuid }
    this.$druxtRouter().getResource(viewQuery).then(view => {
      this.view = view
    })

    const resultsQuery = { type: `views--${this.viewId}`, id: this.displayId }
    this.$druxtRouter().getResource(resultsQuery).then(results => {
      this.results = results
    })
  },
}
</script>

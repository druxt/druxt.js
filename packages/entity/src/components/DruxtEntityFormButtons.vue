<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

export default {
  name: 'DruxtEntityFormButtons',

  extends: DruxtModule,

  props: {
    /**
     * Drupal Field schema information.
     *
     * @type {object}
     */
    schema: {
      type: Object,
      required: true
    },
  },

  methods: {
    /**
     * Get scoped slots for Entity form buttons.
     *
     * @return {object}
     */
    getScopedSlots() {
      const buttons = ['submit', 'reset']
      
      const scopedSlots = Object.fromEntries(buttons.map((button) => [
        button,
        (attrs) => this.$createElement(
          'button', 
          {
            attrs,
            domProps: {
              id: button,
            },
            on: {
              click: (e) => {
                e.preventDefault()
                this.$emit(button, this.model)
              }
            }
          },
          [button.charAt(0).toUpperCase() + button.slice(1)]
        )
      ]))

      // Build default slot.
      scopedSlots.default = (attrs) => Object.keys(scopedSlots)
        .filter((key) => !['default', '_normalized'].includes(key))
        .map((key) => scopedSlots[key](attrs))

      return scopedSlots
    },
  },

  druxt: {
    componentOptions: ({ schema }) => {
      let options = []
      // Ensure that the schema config data is present.
      if (schema.config) {
        options = [
          [schema.config.entityType, schema.config.bundle, schema.config.mode, schema.config.schemaType],
          [schema.resourceType, schema.config.mode, schema.config.schemaType],
          [schema.config.entityType, schema.config.bundle, schema.config.schemaType],
          [schema.resourceType, schema.config.schemaType],
        ]
      }
      options.push(['default'])
      return options
    },
  },
}
</script>

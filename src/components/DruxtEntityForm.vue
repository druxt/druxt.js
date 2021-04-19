<script>
import { DruxtEntity } from '..'

export default {
  name: 'DruxtEntityForm',

  extends: DruxtEntity,

  props: {
    schemaType: {
      type: String,
      default: 'form',
    },
  },

  data: () => ({
    response: undefined,
    submitting: false,
  }),

  computed: {
    errors: ({ response }) => (response || {}).errors,
  },

  methods: {
    /**
     * Get scoped slots for each Entity field.
     *
     * @return {object}
     */
    getScopedSlots() {
      // Use DruxtEntity to build the Field based slots.
      const scopedSlots = DruxtEntity.methods.getScopedSlots.call(this)

      scopedSlots.buttons = (attrs) => this.$createElement(
        'DruxtEntityFormButtons',
        {
          attrs,
          on: {
            reset: this.onReset,
            submit: this.onSubmit,
          },
          props: {
            schema: this.schema || {},
          },
          ref: 'buttons',
        },
      )

      // Build default slot.
      scopedSlots.default = (attrs) => [
        ...Object.entries(this.fields).map(([id]) => scopedSlots[id](attrs)),
        scopedSlots.buttons(attrs)
      ]

      return scopedSlots
    },

    onReset() {
      this.model = JSON.parse(JSON.stringify(this.entity)),
      this.$emit('reset')
    },

    async onSubmit() {
      if (this.submitting) return false
      this.submitting = true

      let url = this.schema.config.href
      let method = 'post'
      if (this.entity.id) {
        // @todo - Reduce size of payload by only sending changed data.
        url = [url, this.entity.id].join('/')
        method = 'patch'
      }

      // Try to send data to backend, and catch any resulting errors.
      try {
        this.response = await this.$druxt.axios[method](
          url,
          { data: this.model },
          {
            headers: {
              'Content-Type': 'application/vnd.api+json',
            },
          }
        )

        // Update the Vuex store.
        const { type, id } = this.response.data.data
        Object.keys(this.$store.state.druxt.resources[type][id]).map((hash) =>
          this.$store.commit('druxt/addResource', { resource: this.response.data, hash })
        )
      } catch (e) {
        this.response = (e.response || {}).data || e
      }
      this.submitting = false
    },
  },
}
</script>

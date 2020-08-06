import { mapActions } from 'vuex'

/**
 * @mixin
 */
const DruxtSchemaMixin = {
  /**
   * Props.
   */
  props: {
    mode: {
      type: String,
      default: 'default'
    },

    type: {
      type: String,
      required: true
    }
  },

  data: () => ({
    schema: false
  }),

  created() {
    // Lazy load the schema.
    this.getSchema({ resourceType: this.type, mode: this.mode }).then(res => {
      this.schema = res
    })
  },

  methods: {
    ...mapActions({
      getSchema: 'druxtSchema/get'
    })
  }
}

export { DruxtSchemaMixin }

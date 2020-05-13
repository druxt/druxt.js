import { mapActions, mapState } from 'vuex'

/**
 * @mixin
 */
const DruxtRouterEntityMixin = {
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
    },

    /**
     * The Drupal entity UUID.
     */
    uuid: {
      type: String,
      required: true
    }
  },

  data: () => ({
    entity: false,
    loading: true
  }),

  created () {
    if (typeof this.entities[this.uuid] !== 'undefined') {
      this.entity = this.entities[this.uuid]
      return
    }

    if (!this.entity && this.uuid && this.type) {
      this.getEntity({ id: this.uuid, type: this.type }).then((res) => {
        this.entity = res
        this.loading = false
      })
    }
  },

  computed: {
    ...mapState({
      entities: state => state.druxtRouter.entities
    })
  },

  methods: {
    ...mapActions({
      getEntity: 'druxtRouter/getEntity'
    })
  }
}

export { DruxtRouterEntityMixin }

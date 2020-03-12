const vuex = require('vuex')

/**
 * @mixin
 */
const DruxtRouterEntityMixin = {
  /**
   * Props.
   */
  props: {
    /**
     * The Drupal entity UUID.
     */
    uuid: {
      type: String,
      required: true
    },

    type: {
      type: String,
      required: true
    }
  },

  created () {
    if (typeof this.entities[this.uuid] !== 'undefined') {
      return
    }

    this.loading = true
    this.getEntity({ id: this.uuid, type: this.type }).then((res) => {
      // If component has `onDruxtRouterLoad` method, pass through allowing it to load additonal entities.
      this.loading = typeof this.onDruxtRouterLoad === 'function' ? !!this.onDruxtRouterLoad(res) : false
    })
  },

  data: () => ({
    loading: false
  }),

  computed: {
    entity () {
      return this.entities[this.uuid]
    },

    ready () {
      return !this.loading && !!this.entity
    },

    ...vuex.mapState({
      entities: state => state.druxtRouter.entities
    })
  },

  methods: {
    ...vuex.mapActions({
      getEntity: 'druxtRouter/getEntity'
    })
  }
}

export { DruxtRouterEntityMixin }

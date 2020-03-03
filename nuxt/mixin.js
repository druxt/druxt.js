const mapState = require('vuex').mapState

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
    this.$store.dispatch('druxtRouter/getEntity', { id: this.uuid, type: this.type }).then((res) => {
      this.loading = false
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

    ...mapState({
      entities: state => state.druxtRouter.entities,
      route: state => state.druxtRouter.route,
      schema: state => state.druxtRouter.schema
    })
  }
}

module.exports = DruxtRouterEntityMixin
module.exports.meta = require('../package.json')

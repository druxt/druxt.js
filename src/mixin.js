/**
 * @vuepress
 * ---
 * title: Mixin
 * ---
 */

import { mapActions, mapState } from 'vuex'

/**
 * @mixin
 */
const DruxtRouterEntityMixin = {
  /**
   * Vue properties.
   */
  props: {
    /**
     * The Drupal display mode.
     * @type {string}
     */
    mode: {
      type: String,
      default: 'default'
    },

    /**
     * The JSON:API resource type.
     * @type {string}
     */
    type: {
      type: String,
      required: true
    },

    /**
     * The Drupal entity UUID.
     * @type {string}
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

  /**
   * Lazy load JSON:API resource using props.
   */
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

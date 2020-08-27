/**
 * @vuepress
 * ---
 * title: DruxtRouterEntityMixin
 * ---
 */

import { mapActions, mapState } from 'vuex'

/**
 * The DruxtRouterEntityMixin Vue.js mixin provides easy integration with the Druxt.js Router Vuex store, including on-demand loading of JSON:API resources.
 *
 * @mixin
 *
 * @example @lang vue
 * <template>
 *   <div v-if="entity && !loading">
 *     {{ entity }}
 *   </div>
 * </template>
 *
 * <script>
 * // Import mixin.
 * import { DruxtRouterEntityMixin } from 'druxt-router'
 *
 * export default {
 *   // Set mixin.
 *   mixins: [DruxtRouterEntityMixin]
 * }
 * </script>
 */
const DruxtRouterEntityMixin = {
  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The Drupal display mode.
     *
     * @type {string}
     * @default default
     */
    mode: {
      type: String,
      default: 'default'
    },

    /**
     * The JSON:API resource type.
     *
     * @type {string}
     */
    type: {
      type: String,
      required: true
    },

    /**
     * The Drupal entity UUID.
     *
     * @type {string}
     */
    uuid: {
      type: String,
      required: true
    }
  },

  /**
   * Loads the JSON:API resource via the Vuex store.
   */
  async fetch () {
    // Use resource from Vuex store if available.
    if (typeof this.entities[this.uuid] !== 'undefined') {
      this.entity = this.entities[this.uuid]
      return
    }

    // Otherwise invoke getEntity() to retrieve it from Drupal.
    if (!this.entity && this.uuid && this.type) {
      this.entity = await this.getEntity({ id: this.uuid, type: this.type })
      this.loading = false
    }
  },

  /**
   * Vue.js Data object.
   *
   * Used for on-demand JSON:API resource loading.
   *
   * @property {object} entity - The Drupal entity JSON:API resource.
   * @property {boolean} loading - The loading state.
   */
  data: () => ({
    entity: false,
    loading: true
  }),

  /**
   * Vue.js Computed properties.
   *
   * - Maps Vuex `entities` state to `this->entities`.
   *
   * @property {object} entities - The mapped Druxt.js Router Vuex `entities` state.
   * @see {@link store|src/store.js}
   */
  computed: {
    ...mapState({
      entities: state => state.druxtRouter.entities
    })
  },

  /**
   * Vue.js Methods.
   *
   * - Maps Vuex `druxtRouter/getEntity` action to `this->getEntity()`.
   *
   * @see {@link store|src/store.js}
   */
  methods: {
    ...mapActions({
      getEntity: 'druxtRouter/getEntity'
    })
  }
}

export { DruxtRouterEntityMixin }

<script>
import { DruxtModule } from 'druxt'
import { mapActions } from 'vuex'

/**
 * The `<DruxtBlock />` Vue.js component.
 *
 * - Loads the JSON:API Block resource from Drupal via the DruxtJS Router module.
 * - Renders the data via the DruxtComponentMixin.
 *
 * @example
 * <DruxtBlock
 *   uuid="59104acd-88e1-43c3-bd5f-35800f206394"
 * />
 */
export default {
  name: 'DruxtBlock',

  extends: DruxtModule,

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * Entity UUID.
     *
     * @type {string}
     */
    uuid: {
      type: String,
      required: true,
    },
  },

  data: () => ({
    resource: {},
  }),

  async fetch() {
    this.resource = await this.getResource({
      type: 'block--block',
      id: this.uuid,
    })
    
    await DruxtModule.fetch.call(this)
  },

  computed: {
    block: ({ resource }) => (resource || {}).data,
  },

  methods: {
    /**
     * Maps Vuex action to methods.
     */
    ...mapActions({
      getResource: 'druxt/getResource',
    })
  },

  /**
   * Druxt module function.
   */
  druxt: {
    componentOptions: ({ block }) => {
      // Get Plugin and Plugin ID data.
      let plugin = block.attributes.plugin
      let pluginId = null
      if (plugin.includes(':')) {
        [plugin, pluginId] = plugin.split(':')
      }

      // Construct component options.
      const componentOptions = []
      if (pluginId) {
        componentOptions.push([plugin, pluginId, block.attributes.region, block.attributes.theme])
        componentOptions.push([plugin, pluginId, block.attributes.theme])
      }
      componentOptions.push([plugin, block.attributes.region, block.attributes.theme])
      componentOptions.push([plugin, block.attributes.theme])
      componentOptions.push(['default'])
      return componentOptions
    },

    propsData: ({ block }) => ({ block }),
  },
}
</script>

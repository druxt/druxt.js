<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
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
     * Block internal ID.
     */
    id: {
      type: String,
      default: null,
    },

    /**
     * Block Entity UUID.
     *
     * @type {string}
     */
    uuid: {
      type: String,
      default: null,
    },
  },

  async fetch() {
    const type = 'block--block'
    const query = new DrupalJsonApiParams()
    if (Array.isArray((((this.$druxtBlocks || {}).options || {}).query || {}).fields)) {
      query.addFields(type, [
        ...this.$druxtBlocks.options.query.fields,
        'plugin',
        'region',
        'settings',
        'theme',
      ])
    }

    // Get Block by UUID.
    if (this.uuid) {
      const id = this.uuid
      this.resource = await this.getResource({ type, id, query })
    }

    // Get Block by Drupal internal ID.
    else if (this.id) {
      query.addFilter('drupal_internal__id', this.id)
      const collection = await this.getCollection({ type, query })
      this.resource = { data: collection.data[0] }
    }
    
    await DruxtModule.fetch.call(this)
  },

  data: () => ({
    resource: {},
  }),

  computed: {
    block: ({ resource }) => (resource || {}).data,
  },

  methods: {
    getScopedSlots() {
      // Build scoped slots for each block.
      const scopedSlots = {}
      const h = this.$createElement

      // Build default slot.
      // Default to nothing, as there's not enough information to build a
      // one-size-fits-all Drupal block.
      scopedSlots.default = () => null
      // Pass through default scoped slot if provided.
      if (this.$scopedSlots.default) {
        scopedSlots.default = (attrs) => this.$scopedSlots.default({
          ...this.$options.druxt.propsData(this),
          ...attrs
        })
      // Provide debug data if Nuxt is running in dev mode.
      } else if (this.$nuxt.context.isDev)  {
        scopedSlots.default = (attrs) => h('details', [
          h('summary', [`[DruxtBlock] Missing wrapper component for '${((this.block || {}).attributes || {}).drupal_internal__id}'`]),
          h('label', ['Component options:', h('ul', this.component.options.map((s) => h('li', [s])))]),
          h('label', ['Block settings:', h('pre', [JSON.stringify(((this.block || {}).attributes || {}).settings)])])
        ])
      }

      return scopedSlots
    },

    /**
     * Maps Vuex action to methods.
     */
    ...mapActions({
      getCollection: 'druxt/getCollection',
      getResource: 'druxt/getResource',
    })
  },

  /**
   * Druxt module function.
   */
  druxt: {
    componentOptions: ({ block }) => {
      // Get Plugin and Plugin ID data.
      let plugin = block.attributes.plugin || ''
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

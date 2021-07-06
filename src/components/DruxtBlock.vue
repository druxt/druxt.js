<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtModule } from 'druxt'
import { mapActions } from 'vuex'

/**
 * The `<DruxtBlock />` component renders a Drupal JSON:API Resource block by
 * ID or UUID.
 *
 * @example @lang vue
 * <DruxtBlock id="umami_branding" />
 *
 * @example @lang vue
 * <DruxtBlock uuid="59104acd-88e1-43c3-bd5f-35800f206394" />
 */
export default {
  name: 'DruxtBlock',

  extends: DruxtModule,

  /**
   * The DruxtBlock component requires either the UUID or internal ID property.
   */
  props: {
    /**
     * The Blocks internal ID.
     * 
     * @type string
     * 
     * @example @lang vue
     * <DruxtBlock id="umami_branding" />
     */
    id: {
      type: String,
      default: null,
    },

    /**
     * The Block Entity UUID.
     *
     * @type {string}
     * 
     * @example @lang vue
     * <DruxtBlock uuid="59104acd-88e1-43c3-bd5f-35800f206394" />
     */
    uuid: {
      type: String,
      default: null,
    },
  },

  /**
   * The Nuxt Fetch hook.
   *
   * Fetches the Block JSON:API resource by either UUID or ID.
   */
  async fetch() {
    // Build query.
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

    // Fetch Block by UUID.
    if (this.uuid) {
      const id = this.uuid
      this.resource = await this.getResource({ type, id, query })
    }

    // Fetch Block by Drupal internal ID.
    else if (this.id) {
      query.addFilter('drupal_internal__id', this.id)
      const collection = await this.getCollection({ type, query })
      this.resource = { data: collection.data[0] }
    }
    
    await DruxtModule.fetch.call(this)
  },

  fetchKey(getCounter) {
    const parts = ['DruxtBlock', this.uuid || this.id].filter((o) => o)
    return [...parts, getCounter(parts.join(':'))].join(':')
  },

  /**
   * @property {object} resource - The JSON:API resource object.
   */
  data: () => ({
    resource: {},
  }),

  /** */
  computed: {
    /**
     * The Block entity data.
     *
     * @return {object}
     */
    block: ({ resource }) => (resource || {}).data,
  },

  methods: {
    /**
     * Maps Vuex action to methods.
     */
    ...mapActions({
      getCollection: 'druxt/getCollection',
      getResource: 'druxt/getResource',
    })
  },

  /**
   * Druxt module configuration.
   */
  druxt: {
    /**
     * Provides the available component naming options for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {ComponentOptions}
     */
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

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: ({ block }) => ({ block }),

    /**
     * Provides the scoped slots object for the Module render function.
     *
     * A default slot is provided with debug information if Nuxt is in
     * development mode.
     *
     * @return {ScopedSlots} The Scoped slots object.
     */
    slots(h) {
      const scopedSlots = {}

      // Provide debug data if Nuxt is running in dev mode.
      if (this.$nuxt.context.isDev)  {
        scopedSlots.default = (attrs) => h(
          'details',
          {
            style: {
              border: '2px dashed lightgrey',
              margin: '0.5em 0',
              padding: '1em',
            },
          },
          [
            h('summary', [`[DruxtBlock] Missing wrapper component for '${((this.block || {}).attributes || {}).drupal_internal__id}'`]),
            h('br'),
            h('label', ['Component options:', h('ul', this.component.options.map((s) => h('li', [s])))]),
            h('br'),
            h('label', ['Block settings:', h('pre', [JSON.stringify(((this.block || {}).attributes || {}).settings, null, '  ')])])
          ]
        )
      }

      return scopedSlots
    },
  },
}

/**
 * Provides the available naming options for the Wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtBlock[Plugin][PluginId][Region][Theme]',
 *   'DruxtBlock[Plugin][PluginId][Theme]',
 *   'DruxtBlock[Plugin][Region][Theme]',
 *   'DruxtBlock[Plugin][Theme]',
 *   'DruxtBlock[Default]',
 * ]
 *
 * @example <caption>Umami Branding block</caption> @lang js
 * [
 *   'DruxtBlockSystemBrandingBlockHeaderUmami',
 *   'DruxtBlockSystemBrandingBlockHeader',
 *   'DruxtBlockSystemBrandingBlockUmami',
 *   'DruxtBlockSystemBrandingBlock',
 *   'DruxtBlockDefault',
 * ]
 */

/**
 * Provides settings for the Blocks module, via the `nuxt.config.js`
 * `druxt.blocks` object.
 *
 * @typedef {object} ModuleSettings
 * @param {string[]} fields - An array of fields to filter from the JSON:API Resource.
 *
 * @example @lang js
 * {
 *   fields: [],
 * }
 *
 * @example <caption>nuxt.config.js</caption> @lang js
 * export default {
 *   druxt: {
 *     blocks: {
 *       query: {
 *         fields: ['dependencies'],
 *       },
 *     },
 *   },
 * }
 */

/**
 * Provides propsData for use in the Wrapper component.
 *
 * @typedef {object} PropsData
 * @param {object} block - The Block Entity data.
 *
 * @example @lang js
 * {
 *   block: {
 *     attributes: {},
 *     id: '59104acd-88e1-43c3-bd5f-35800f206394',
 *     links: {},
 *     relationships: {},
 *     type: 'block--block',
 *   },
 * }
 */

/**
 * Provides scoped slots for use in the Wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} default - Debug information if Nuxt is in development mode.
 */
</script>

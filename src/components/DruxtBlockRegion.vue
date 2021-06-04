<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtModule } from 'druxt'
import { mapActions, mapState } from 'vuex'

/**
 * The `<DruxtBlockRegion />` Vue.js component.
 *
 * - Loads all JSON:API Block resources for a region/theme via the DruxtJS Router module.
 * - Uses the DruxtBlock component to render individual resources, ordered by weight.
 * - Renders the data via the DruxtComponentMixin.
 *
 * @example
 * <DruxtBlockRegion
 *   name="header"
 *   theme="umami"
 * />
 *
 * @example
 * <Druxt
 *   module="block-region"
 *   name="header"
 *   theme="umami"
 * />
 *
 * @todo {@link https://github.com/druxt/druxt-blocks/issues/25|Add documentation, tests and examples for slots.}
 */
export default {
  name: 'DruxtBlockRegion',

  extends: DruxtModule,

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * Region name.
     *
     * @type {string}
     * @default content
     */
    name: {
      type: String,
      default: 'content'
    },

    /**
     * Drupal theme.
     *
     * @type {string}
     */
    theme: {
      type: String,
      required: true
    },
  },

  /**
   * Nuxt.js fetch method.
   */
  async fetch() {
    // @todo - Add ability to alter query via DruxtModule settings.
    const type = 'block--block'
    const query = new DrupalJsonApiParams()
    query
      .addFilter('region', this.name)
      .addFilter('status', '1')
      .addFilter('theme', this.theme)
      .addSort('weight')
      .addFields(type, ['drupal_internal__id', 'visibility', 'weight'])

    const collection = await this.getCollection({ type, query })
    this.blocks = collection.data

    await DruxtModule.fetch.call(this)
  },

  /**
   * Vue.js Data object.
   *
   * Used for on-demand JSON:API resource loading.
   *
   * @property {objects[]} blocks - The Block JSON:API resources.
   */
  data: () => ({
    blocks: []
  }),

  /**
   * Vue.js Computed properties.
   *
   * @vue-computed {object} route The current Route.
   */
  computed: {
    ...mapState('druxtRouter', {
      route: state => state.route
    })
  },

  methods: {
    getScopedSlots() {
      // Build scoped slots for each block.
      const scopedSlots = {}
      this.blocks.map((block) => {
        scopedSlots[block.attributes.drupal_internal__id] = (attrs) => {
          delete (attrs || {})['data-fetch-key']
          return this.$createElement('DruxtBlock', {
            attrs,
            key: block.attributes.drupal_internal__id,
            props: {
              uuid: block.id,
            },
            ref: block.attributes.drupal_internal__id,
          })
        }
      })

      // Build default slot.
      scopedSlots.default = (attrs) => this.$createElement('div', this.blocks.map((block) => 
        this.isVisible(block)
          ? scopedSlots[block.attributes.drupal_internal__id](attrs)
          : false
      ))
      if (this.$scopedSlots.default) {
        scopedSlots.default = (attrs) => this.$scopedSlots.default({
          ...this.$options.druxt.propsData(this),
          ...attrs
        })
      }

      return scopedSlots
    },

    isVisible(block) {
      // Request path visibility conditions.
      if ((block.attributes.visibility || {}).request_path) {
        let visible = false
        const { negate } = block.attributes.visibility.request_path
        const pages = block.attributes.visibility.request_path.pages.split(/\r?\n/).filter(i => i)

        if (pages.includes('<front>') && (this.route.isHomePath || (!this.route.isHomePath && negate))) {
          visible = true
        }

        if (pages.includes(this.route.resolvedPath) || (!pages.includes(this.route.resolvedPath) && negate)) {
          visible = true
        }

        return visible
      }

      // Default to true.
      // @todo Add support for other visibility plugins.
      return true
    },

    /**
     * Maps `druxt/getCollection` Vuex action to `this.getCollection`.
     */
    ...mapActions({
      getCollection: 'druxt/getCollection'
    })
  },

  druxt: {
    componentOptions: ({ name, theme }) => [[name, theme], ['default']],
    propsData: ({ blocks, name, theme }) => ({ blocks, name, theme }),
  },
}
</script>

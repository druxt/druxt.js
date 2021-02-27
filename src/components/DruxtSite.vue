<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtComponentMixin } from 'druxt'
import { mapActions } from 'vuex'

/**
 * The `<DruxtSite />` Vue.js component.
 *
 * - Loads available Block regions for the specified theme.
 * - Renders Block regions via the `<DruxtBlockRegion />` component.
 * - Supports the Druxt slot based themeing system.
 *
 * @example @lang vue
 * <template>
 *   <DruxtSite theme="umami" />
 * </template>
 *
 * @example <caption>DruxtSite**Umami**.vue</caption> @lang vue
 * <template>
 *   <div>
 *     <slot name="header" />
 *     <slot name="content" />
 *     <slot name="footer" />
 *   </div>
 * </template>
 *
 * @see {@link https://blocks.druxtjs.org/api/components/DruxtBlockRegion|DruxtBlockRegion}
 */
export default {
  name: 'DruxtSite',

  /**
   * Vue.js Mixins.
   *
   * @see {@link https://druxtjs.org/api/mixins/component|DruxtComponentMixin}
   */
  mixins: [DruxtComponentMixin],

  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * Drupal theme ID.
     *
     * Used to filter the available regions from the Drupal Blocks JSON:API
     * resources.
     *
     * @type {string}
     */
    theme: {
      type: String,
      required: true
    }
  },

  /**
   * Nuxt.js fetch method.
   *
   * Fetches theme filtered region names from the Block JSON:API resources to be
   * used to render the `<DruxtBlockRegion />`'s.
   */
  async fetch() {
    // Fetch all available regions.
    const type = 'block--block'
    const regions = await this.getCollection({
      type,
      query: new DrupalJsonApiParams()
        .addFilter('theme', this.theme)
        .addFields(type, ['region']),
    }).then((resources) => resources.data.map((resource) => resource.attributes.region).filter((v, i, s) => s.indexOf(v) === i))
    this.regions = regions

    // Invoke DruxtComponent mixin.
    await DruxtComponentMixin.fetch.call(this)
  },

  /**
   * @property {string[]} regions - An array of unique region names.
   */
  data: () => ({
    regions: []
  }),

  methods: {
    ...mapActions({ getCollection: 'druxt/getCollection' }),
  },

  render(h) {
    const wrapperData = {
      class: this.wrapper.class || undefined,
      style: this.wrapper.style || undefined,
      props: this.wrapper.propsData,
    }

    // Return only wrapper if fetch state is still pending.
    if (this.$fetchState.pending) {
      return h(this.wrapper.component, wrapperData)
    }

    // Build scoped slots for each region.
    const scopedSlots = {}
    Object.entries(this.regions).map(([index, region]) => {
      scopedSlots[region] = attrs => h('DruxtBlockRegion', {
        attrs,
        props: {
          name: region,
          theme: this.theme
        }
      })
    })

    // Build default slot.
    scopedSlots.default = attrs => Object.entries(this.regions).map(([index, region]) => scopedSlots[region](attrs))

    // Return wrapped component.
    return h(this.wrapper.component, wrapperData, [
      h(this.component.is, {
        props: this.component.propsData,
        scopedSlots,
      })
    ])
  },

  druxt: ({ vm }) => ({
    componentOptions: [[vm.theme], ['default']],

    propsData: {
      theme: vm.theme,
      regions: vm.regions
    }
  })
}
</script>

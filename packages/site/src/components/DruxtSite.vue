<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
import { mapActions } from 'vuex'

/**
 * The DruxtSite component renders all available Drupal block regions and
 * content, based on the specified theme.
 *
 * While Drupal provides placement configuration for blocks, it does not provide
 * any information on where each region should be placed.
 *
 * All regions are provided as scoped slots for the Druxt Wrapper component.
 *
 * @example @lang vue
 * <template>
 *   <DruxtSite theme="umami" />
 * </template>
 *
 * @example <caption>DruxtSite Wrapper component boilerplate</caption> @lang vue
 * <template>
 *   <div>
 *     <slot name="header" />
 *     <slot name="content" />
 *     <slot name="footer" />
 *   </div>
 * </template>
 *
 * <script>
 * import { DruxtSiteMixin } from 'druxt-site'
 * export default {
 *   mixins: [DruxtSiteMixin]
 * }
 *
 * @example <caption>DruxtSite with template injection</caption> @lang vue
 * <DruxtSite>
 *   <template #default="{ props, regions, theme }">
 *     <!-- Do whatever you want here -->
 *     <DruxtBlockRegion
 *       v-for="region of regions"
 *       :key="region"
 *       v-bind="props[region]"
 *     />
 *   </template>
 * </DruxtSite>
 *
 * @see {@link /api/packages/blocks/components/DruxtBlockRegion|DruxtBlockRegion}
 */
export default {
  name: 'DruxtSite',

  extends: DruxtModule,

  /** */
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
      default: undefined,
    }
  },

  data: ({ $druxt }) => ({
    defaultTheme: ($druxt.settings.site || {}).theme,
  }),

  /** */
  computed: {
    /**
     * DruxtBlockRegion propsData for regions.
     *
     * @return {object}
     */
    props: ({ defaultTheme, regions, theme }) =>
      Object.fromEntries(regions.map((region) => [region, {
        key: region,
        name: region,
        theme: theme || defaultTheme,
      }])),

    /**
     * An array of unique region names.
     * @return {string[]}
     */
    regions: ({ model, value }) => model || value || [],
  },

  watch: {
    theme() {
      this.$fetch()
    }
  },

  methods: {
    ...mapActions({ getCollection: 'druxt/getCollection' }),
  },

  /**
   * Druxt module configuration.
   */
  druxt: {
    /**
     * Provides the available component naming options for the Druxt Wrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {ComponentOptions}
     */
    componentOptions: ({ defaultTheme, theme }) => [[theme || defaultTheme], ['default']],

    /**
     * Fetches theme filtered region names from the Block JSON:API resources to
     * be used to render the `<DruxtBlockRegion />`'s.
     */
    async fetchConfig() {
      const type = 'block--block'

      // If no default theme is provided, get the first available valid theme.
      if (!this.defaultTheme) {
        this.defaultTheme = await this.getCollection({
          type,
          query: new DrupalJsonApiParams()
            .addFields(type, ['theme'])
            .addFilter('plugin', 'system_main_block')
            .addPageLimit(1)
        }).then((resources) => resources.data[0].attributes.theme)
      }

      // Fetch all available regions.
      if (!this.value) {
        this.model = await this.getCollection({
          type,
          query: new DrupalJsonApiParams()
            .addFilter('theme', this.theme || this.defaultTheme)
            .addFields(type, ['region']),
        }).then((resources) => resources.data.map((resource) => resource.attributes.region).filter((v, i, s) => s.indexOf(v) === i))
      }
    },

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: ({ defaultTheme, props, regions, theme }) => ({ props, regions, theme: theme || defaultTheme }),

    /**
     * Provides the scoped slots object for the Module render function.
     *
     * A scoped slot is provided for each block region available, as per the
     * specified theme.
     *
     * Additionally, the `default` slot will render all regions, or the Nuxt
     * component when no block region data is available.
     *
     * @example <caption>DruxtSite**Theme**.vue</caption> @lang vue
     * <template>
     *   <div>
     *     <slot name="content" />
     *     <slot :name="region_name" />
     *   </div>
     * </template>
     *
     * @return {ScopedSlots} The Scoped slots object.
     */
    slots(h) {
      // If no regions, return Nuxt component.
      if (!this.regions.length) {
        return { default: () => h('Nuxt') }
      }

      // Build scoped slots for each region.
      const scopedSlots = {
        ...Object.fromEntries(this.regions.map((region) => [region, (attrs) => h('DruxtBlockRegion', {
          attrs,
          key: region,
          props: this.props[region],
          ref: region,
        })]))
      }

      // Build default slot.
      scopedSlots.default = (attrs) => this.regions.map((region) => (scopedSlots[region] || (() => {}))(attrs))

      return scopedSlots
    },

    /**
     * Druxt development template tool configuration.
     */
    template: {
      debug: '{ props, regions, theme }',
    }
  }
}

/**
 * Provides the available naming options for the Wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtSite[Theme][Langcode]',
 *   'DruxtSite[Theme]',
 *   'DruxtSite[Default][Langcode]',
 *   'DruxtSite[Default]',
 * ]
 *
 * @example <caption>Umami</caption> @lang js
 * [
 *   'DruxtSiteUmamiEn',
 *   'DruxtSiteUmami',
 *   'DruxtSiteDefaultEn',
 *   'DruxtSiteDefault',
 * ]
 */

/**
 * Provides propsData for use in the Wrapper component.
 *
 * @typedef {object} PropsData
 * @param {object} props - DruxtBlockRegion propsData for regions.
 * @param {string[]} regions - An array of unique region names.
 * @param {string} theme - Drupal theme ID.
 *
 * @example @lang js
 * {
 *   props: {
 *     content: {
 *       name: 'content',
 *       theme: 'umami',
 *     },
 *     ...
 *   },
 *   regions: ['breadcrumbs', 'header', 'content', ...],
 *   theme: 'umami',
 * }
 */

/**
 * Provides scoped slots for use in the Wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} * - Slot per region.
 * @param {function} default - All regions.
 *
 * @example <caption>DruxtSite**Theme**.vue</caption> @lang vue
 * <template>
 *   <div>
 *     <slot name="content" />
 *     <slot :name="region_name" />
 *   </div>
 * </template>
 */
</script>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
import { mapActions } from 'vuex'

/**
 * Renders all available block regions based on the specified theme.
 *
 * @example @lang vue
 * <template>
 *   <DruxtSite theme="umami" />
 * </template>
 *
  * @example <caption>Default slot override</caption> @lang vue
 * <template>
 *   <DruxtSite theme="umami">
 *     <template #default="{ props, regions, theme }">
 *       <DruxtBlockRegion
 *         v-for="region of regions"
 *         :key="region"
 *         v-bind="props[region]"
 *       />
 *     </template>
 *   </DruxtSite>
 * </template>
 *
 * @example <caption>Wrapper component</caption> @lang vue
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

  extends: DruxtModule,

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
      default: undefined,
    }
  },

  data: ({ $druxt }) => ({
    defaultTheme: ($druxt.settings.site || {}).theme,
  }),

  /**
   * Nuxt.js fetch method.
   *
   * Fetches theme filtered region names from the Block JSON:API resources to be
   * used to render the `<DruxtBlockRegion />`'s.
   */
  async fetch() {
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

    // Call DruxtModule fetch hook.
    await DruxtModule.fetch.call(this)
  },

  /**
   * Vue.js Computed properties.
   */
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
    slots() {
      // If no regions, return Nuxt component.
      if (!this.regions.length) {
        return { default: () => this.$createElement('Nuxt') }
      }

      // Build scoped slots for each region.
      const scopedSlots = {
        ...Object.fromEntries(this.regions.map((region) => [region, (attrs) => this.$createElement('DruxtBlockRegion', {
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
  }
}

/**
 * Provides the available naming options for the Wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtSite[Theme]',
 *   'DruxtSiteDefault',
 * ]
 *
 * @example <caption>Umami</caption> @lang js
 * [
 *   'DruxtSiteUmami',
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

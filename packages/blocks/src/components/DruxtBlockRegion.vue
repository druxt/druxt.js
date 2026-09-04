<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
import { mapActions, mapState } from 'vuex'

/**
 * The DruxtBlockRegion component renders visible blocks based on region and
 * theme.
 *
 * All blocks, including those not visible, are provided as slots for the Druxt
 * Wrapper component.
 *
 * @see https://druxtjs.org/modules/blocks
 *
 * @example @lang vue
 * <DruxtBlockRegion name="header" theme="umami" />
 *
 * @example <caption>DruxtBlockRegion Wrapper component boilerplate</caption> @lang vue
 * <template>
 *   <DruxtDebug :json="blocks" />
 * </template>
 *
 * <script>
 * import { DruxtBlocksRegionMixin } from 'druxt-blocks'
 * export default {
 *   mixins: [DruxtBlocksRegionMixin]
 * }
 *
 * @see {@link https://druxtjs.org/explanation/component-resolution|Component resolution}
 *
 * @example <caption>DruxtBlockRegion default slot (template injection)</caption> @lang vue
 * <DruxtBlockRegion name="header" theme="umami">
 *   <template #default="{ blocks }">
 *     <!-- Do whatever you want here -->
 *     <DruxtDebug :json="blocks" />
 *   </template>
 * </DruxtBlockRegion>
 */
export default {
  name: 'DruxtBlockRegion',

  extends: DruxtModule,

  /** */
  props: {
    /**
     * A region machine name from the Drupal theme's block layout
     * (/admin/structure/block).
     *
     * @type {string}
     * @default content
     *
     * @example @lang vue
     * <DruxtBlockRegion name="header" :theme="theme" />
     */
    name: {
      type: String,
      default: 'content'
    },

    /**
     * The machine name of the Drupal theme that provides the block layout.
     *
     * @type {string}
     * @required
     *
     * @example @lang vue
     * <DruxtBlockRegion theme="umami" />
     */
    theme: {
      type: String,
      required: true
    },
  },

  /**
   * Provides the fetched Block resources for the region.
   *
   * @property {object[]} blocks - The Block JSON:API resources.
   */
  data: () => ({
    blocks: []
  }),

  fetchKey(getCounter) {
    const parts = ['DruxtBlockRegion', this.name].filter((o) => o)
    return [...parts, getCounter(parts.join(':'))].join(':')
  },

  /**
   * @vue-computed {object} route The current Route from the [DruxtRouter vuex store](https://druxtjs.org/api/packages/router/stores/router).
   */
  computed: {
    ...mapState('druxtRouter', {
      route: state => state.route
    })
  },

  watch: {
    name() {
      this.$fetch()
    },

    theme() {
      this.$fetch()
    }
  },

  methods: {
    /**
     * Checks if a given block should be visible.
     *
     * Uses Request Path visibility details if available with the DruxtRouter.
     *
     * @param {object} block - The Block entity object.
     *
     * @return {boolean} `true` if the block should be rendered on the current route.
     */
    isVisible(block) {
      // Request path visibility conditions.
      if ((block.attributes.visibility || {}).request_path) {
        let visible = false
        const { negate } = block.attributes.visibility.request_path
        const pages = block.attributes.visibility.request_path.pages.split(/\r?\n/).filter(i => i)

        if (pages.includes('<front>') && (this.route.isHomePath || (!this.route.isHomePath && negate))) {
          visible = true
        }

        // Remove langcode prefix from the resolved path before comparing.
        const resolvedPath = (this.route.resolvedPath || '').replace(new RegExp(`^/${this.lang}`), '')
        if (pages.includes(resolvedPath) || (!pages.includes(resolvedPath) && negate)) {
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

  /**
   * DruxtModule configuration.
   */
  druxt: {
    /**
     * Provides the available component naming options for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @param {string} context.name - The region machine name.
     * @param {string} context.theme - The Drupal theme machine name.
     * @returns {ComponentOptions}
     */
    componentOptions: ({ name, theme }) => [[name, theme], ['default']],

    /**
     * Fetches all blocks by region and theme.
     */
    async fetchConfig() {
      const type = 'block--block'
      const query = new DrupalJsonApiParams()
      query
        .addFilter('region', this.name)
        .addFilter('status', '1')
        .addFilter('theme', this.theme)
        .addSort('weight')
        .addFields(type, ['drupal_internal__id', 'visibility', 'weight'])

      const collection = await this.getCollection({
        prefix: this.lang,
        type,
        query
      })
      this.blocks = collection.data
    },

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @param {object[]} context.blocks - The Block JSON:API resources for the region.
     * @param {string} context.name - The region machine name.
     * @param {string} context.theme - The Drupal theme machine name.
     * @returns {PropsData}
     */
    propsData: ({ blocks, name, theme }) => ({ blocks, name, theme }),

    /**
     * Provides the scoped slots object for the Module render function.
     *
     * A scoped slot is provided for each block in the region, regardless of
     * visibility.
     *
     * The `default` slot will render all blocks, filtered by route visibility.
     *
     * @return {ScopedSlots} The Scoped slots object.
     *
     * @example <caption>DruxtBlockRegion**Name**.vue</caption> @lang vue
     * <template>
     *   <div v-if="default">
     *     <slot />
     *   </div>
     *
     *   <div v-else>
     *     <slot name="umami_branding" />
     *   </div>
     * </template>
     * @param {Function} h - The Vue createElement function.
     */
    slots(h) {
      // Build scoped slots for each block.
      const scopedSlots = {}
      this.blocks.map((block) => {
        scopedSlots[block.attributes.drupal_internal__id] = (attrs) => {
          delete (attrs || {})['data-fetch-key']
          return h('DruxtBlock', {
            attrs,
            key: block.attributes.drupal_internal__id,
            props: {
              langcode: this.langcode,
              uuid: block.id,
            },
            ref: block.attributes.drupal_internal__id,
          })
        }
      })

      // Build default slot.
      scopedSlots.default = (attrs) => h('div', this.blocks.map((block) =>
        this.isVisible(block)
          ? scopedSlots[block.attributes.drupal_internal__id](attrs)
          : false
      ))

      return scopedSlots
    },

    /**
     * Druxt development template tool configuration.
     */
    template: {
      debug: '{ blocks, name, theme }',
      mixins: {
        'DruxtBlocksRegionMixin': 'druxt-blocks'
      }
    }
  }
}

/**
 * Provides the available naming options for the wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @see {@link https://druxtjs.org/explanation/component-resolution|Component resolution}
 *
 * @example @lang js
 * [
 *   'DruxtBlockRegion[Name][Theme][Langcode]',
 *   'DruxtBlockRegion[Name][Theme]',
 *   'DruxtBlockRegion[Name][Langcode]',
 *   'DruxtBlockRegion[Name]',
 *   'DruxtBlockRegion[Default][Langcode]',
 *   'DruxtBlockRegion[Default]',
 * ]
 *
 * @example <caption>Banner top - Umami</caption> @lang js
 * [
 *   'DruxtBlockRegionBannerTopUmamiEn',
 *   'DruxtBlockRegionBannerTopUmami',
 *   'DruxtBlockRegionBannerTopEn',
 *   'DruxtBlockRegionBannerTop',
 *   'DruxtBlockRegionDefaultEn',
 *   'DruxtBlockRegionDefault',
 * ]
 */

/**
 * Provides propsData for use in the wrapper component.
 *
 * @typedef {object} PropsData
 * @param {object[]} blocks - The Block JSON:API resources.
 * @param {string} name - The region machine name.
 * @param {string} theme - The Drupal theme machine name.
 *
 * @example @lang js
 * {
 *   blocks: [{
 *     attributes: {},
 *     id: '59104acd-88e1-43c3-bd5f-35800f206394',
 *     links: {},
 *     relationships: {},
 *     type: 'block--block',
 *   }],
 *   name: 'banner_top,
 *   theme: 'umami',
 * }
 */

/**
 * Provides scoped slots for use in the wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} [drupal_internal__id] - Slot per block.
 * @param {function} default - All blocks, filtered by route visibility.
 *
 * @example <caption>DruxtBlockRegion**Name**.vue</caption> @lang vue
 * <template>
 *   <div v-if="default">
 *     <slot />
 *   </div>
 *
 *   <div v-else>
 *     <slot name="umami_branding" />
 *   </div>
 * </template>
 */
</script>

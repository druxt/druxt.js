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
 * @example <caption>DruxtBlockRegion with template injection</caption> @lang vue
 * <DruxtBlock id="umami_branding">
 *   <template #default="{ block }">
 *     <!-- Do whatever you want here -->
 *     <DruxtDebug :json="block" />
 *   </template>
 * </DruxtBlock>
 */
export default {
  name: 'DruxtBlockRegion',

  extends: DruxtModule,

  /** */
  props: {
    /**
     * The Block regions machine name.
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
     * A Drupal theme machine name.
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
   * @property {objects[]} blocks - The Block JSON:API resources.
   */
  data: () => ({
    blocks: []
  }),

  fetchKey(getCounter) {
    const parts = ['DruxtBlockRegion', this.name].filter((o) => o)
    return [...parts, getCounter(parts.join(':'))].join(':')
  },

  /**
   * @vue-computed {object} route The current Route from the [DruxtRouter vuex store](https://router.druxtjs.org/api/stores/router.html).
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
     * Checks if a given block shoud be visible.
     *
     * Uses Request Path visibility details if available with the DruxtRouter.
     *
     * @param {object} block - The Block entity object.
     *
     * @return {boolean}
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
  },
}

/**
 * Provides the available naming options for the Wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtBlockRegion[Name][Theme]',
 *   'DruxtBlockRegion[Name]',
 *   'DruxtBlockRegion[Default]',
 * ]
 *
 * @example <caption>Banner top - Umami</caption> @lang js
 * [
 *   'DruxtBlockRegionBannerTopUmami',
 *   'DruxtBlockRegionBannerTop',
 *   'DruxtBlockRegionDefault',
 * ]
 */

/**
 * Provides propsData for use in the Wrapper component.
 *
 * @typedef {object} PropsData
 * @param {object[]} blocks - The Block JSON:API resources.
 * @param {string} name - The Block regions machine name.
 * @param {string} theme - A Drupal theme machine name.
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
 * Provides scoped slots for use in the Wrapper component.
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

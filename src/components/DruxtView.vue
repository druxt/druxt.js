<script>
import merge from 'deepmerge'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { DruxtModule } from 'druxt'
import { parse, stringify } from 'qs'
import { mapActions } from 'vuex'

/**
 * The `<DruxtView />` Vue.js component.
 *
 * Adds support for [Drupal Views](https://www.drupal.org/docs/8/core/modules/views)
 * using the [JSON:API Views module](https://www.drupal.org/project/jsonapi_views).
 *
 * Features:
 * - Exposed filter, sorts and pagination
 * - Scoped slots
 * - Query settings
 *
 * @example
 * <DruxtView
 *   displayId="block_1"
 *   uuid="6ee5e720-bbbf-4d79-b600-21ebc0d954c5"
 *   viewId="promoted_items"
 * />
 */
export default {
  name: 'DruxtView',

  extends: DruxtModule,

  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * The View Display ID.
     *
     * @type {string}
     * @default default
     */
    displayId: {
      type: String,
      default: 'default',
    },

    /**
     * JSON:API Resource type.
     *
     * @type {string}
     * @default view--view
     */
    type: {
      type: String,
      default: 'view--view',
    },

    /**
     * The View UUID.
     *
     * @type {string}
     */
    uuid: {
      type: String,
      default: null,
    },

    /**
     * The View ID.
     *
     * @type {string}
     */
    viewId: {
      type: String,
      default: null,
    }
  },

  /**
   * Nuxt fetch method.
   */
  async fetch() {
    let component = { ...this.component }

    // Fetch View.
    if (!this.view && (this.uuid || this.viewId)) {
      if (this.uuid) {
        this.view = await this.getResource({
          type: this.type,
          id: this.uuid,
        })
      } else {
        const collection = await this.getCollection({ type: this.type, query: new DrupalJsonApiParams().addFilter('drupal_internal__id', this.viewId) })
        this.view = { data: collection.data[0] }
      }

      // Build wrapper component object.
      const options = this.getModuleComponents()
      component = {
        is: (((options.filter(o => o.global) || [])[0] || {}).name || 'DruxtWrapper'),
        options: options.map(o => o.name) || [],
      }
    }

    // Get scoped slots.
    component.slots = Object.keys(this.getScopedSlots())

    // Get wrapper component data to merge with module settings.
    const wrapperData = await this.getWrapperData(component.is)
    component.settings = merge((this.$druxtViews || {}).options || {}, wrapperData.druxt || {}, { arrayMerge: (dest, src) => src })

    // Fetch JSON:API Views resource.
    const viewId = this.viewId || (((this.view || {}).data || {}).attributes || {}).drupal_internal__id
    if (viewId) {
      const query = this.getQuery(component.settings)
      this.resource = await this.getResults({
        viewId,
        displayId: this.displayId,
        query: stringify(query)
      })
    }

    // Build wrapper component propsData.
    component = { ...component, ...this.getModulePropsData(wrapperData.props) }

    // Set component data.
    this.component = component
  },

  fetchKey(getCounter) {
    const parts = ['DruxtView', this.viewId || this.uuid, this.displayId].filter((o) => o)
    return [...parts, getCounter(parts.join(':'))].join(':')
  },

  /**
   * @property {object} model - The model object.
   * @property {object} resource - The JSON:API Views resource.
   * @property {object} view - The View JSON:API resource.
   */
  data() {
    // Stringify and parse the query object to fix nested objects.
    const model = parse(stringify(this.$route.query))

    return {
      model: {
        filter: model.filter || {},
        page: parseInt(model.page) || null,
        sort: model.sort || null,
      },
      resource: null,
      view: false
    }
  },

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * IDs of displays to be attached after the view.
     *
     * @type {string[]}
     */
    attachments_after() {
      if (!((((this.view || {}).data || {}).attributes || {}).display)) return false

      const displays = this.view.data.attributes.display
      return Object.keys(displays).filter(key => {
        return displays[key].display_plugin === 'attachment'
          && displays[key].display_options.attachment_position === 'after'
          && typeof displays[key].display_options.displays[this.displayId] !== 'undefined'
        })
    },

    /**
     * IDs of displays to be attached before the view.
     *
     * @type {string[]}
     */
    attachments_before() {
      if (!((((this.view || {}).data || {}).attributes || {}).display)) return false

      const displays = this.view.data.attributes.display
      return Object.keys(displays).filter(key => {
        return displays[key].display_plugin === 'attachment'
          && displays[key].display_options.attachment_position === 'before'
          && typeof displays[key].display_options.displays[this.displayId] !== 'undefined'
        })
    },

    /**
     * The total item count.
     *
     * @type {integer}
     */
    count() {
      return parseInt(((this.resource || {}).meta || {}).count) || 0
    },

    /**
     * The View Display object.
     *
     * @type {object}
     */
    display() {
      if (!(((this.view || {}).data || {}).attributes || {}).display) return false

      if (this.display_id === 'default') return this.view.data.attributes.display[this.display_id]

      return merge(
        this.view.data.attributes.display['default'],
        this.view.data.attributes.display[this.displayId]
      )
    },

    /**
     * Exposed filters.
     *
     * @type {object[]}
     */
    filters() {
      return Object.values(((this.display || {}).display_options || {}).filters || {}).filter(filter => filter.exposed)
    },

    /**
     * The View Headers data.
     *
     * @type {@object}
     */
    headers() {
      if (!this.display) return []

      return this.display.display_options.header
    },

    /**
     * The View mode for the results entities.
     *
     * @type {string}
     */
    mode() {
      if (!this.display) return 'default'

      if (!this.display.display_options.row.type.includes('entity:')) return 'default'

      return (this.display.display_options.row.options || {}).view_mode || 'default'
    },

    /**
     * The displays pager settings.
     *
     * @type {object}
     */
    pager() {
      return ((this.display || {}).display_options || {}).pager || false
    },

    /**
     * The JSON:API Views results.
     *
     * @type {object[]}
     */
    results() {
      return (this.resource || {}).data || []
    },

    /**
     * Whether a pager should be shown.
     *
     * @type {boolean}
     */
    showPager() {
      return this.pager.type && this.pager.type !== 'none'
    },

    /**
     * Whether Exposed sorts are available and should be displayed.
     *
     * @type {boolean}
     */
    showSorts() {
      return !!(((((this.display || {}).display_options || {}).exposed_form || {}).options || {}).expose_sort_order && this.sorts.length)
    },

    /**
     * Exposed sorts.
     *
     * @type {object[]}
     */
    sorts() {
      return Object.values(((this.display || {}).display_options || {}).sorts || {}).filter(sort => sort.exposed)
    }
  },

  watch: {
    async '$route.query'(to, from) {
      if (!Object.entries(to).length) {
        this.model = {
          filter: {},
          page: null,
          sort: null,
        }
      }
    },

    async displayId() {
      await this.$fetch()
    },

    async query(to, from) {
      await this.$fetch()
    },

    async uuid() {
      await this.$fetch()
    },

    'model.filter': {
      deep: true,
      async handler(to, from) {
        if (!Object.entries(to).length && !Object.entries(from).length) {
          return
        }
        await this.$fetch()
      },
    },

    async 'model.page'(to, from) {
      if (to !== from) {
        await this.$fetch()
      }
    },

    async 'model.sort'(to, from) {
      if (to !== from) {
        await this.$fetch()
      }
    },
  },

  methods: {
    /**
     * Builds the query for the JSON:API request.
     *
     * @param {ModuleSettings} settings - The merged module and component settings object.
     *
     * @return {Query}
     */
    getQuery(settings = {}) {
      const query = {}
      const resourceTypes = (settings.query || {}).resourceTypes || []

      // Check all filters for 'bundle' plugin with bundle data, and use if
      // found build resourceTypes array.
      if ((settings.query || {}).bundleFilter === true) {
        const filters = ((this.display || {}).display_options || {}).filters || []
        Object.values(filters).map((filter) => {
          if (filter.plugin_id === 'bundle' && filter.value) {
            Object.keys(filter.value).map((bundle) => {
              resourceTypes.push(`${filter.entity_type}--${bundle}`)
            })
          }
        })
      }

      // Filter fields.
      if ((resourceTypes || []).length) {
        for (const resourceType of resourceTypes) {
          query[`fields[${resourceType}]`] = ['uuid', ...(settings.query || {}).fields || []].join(',')
        }
      }

      // Pagination.
      if (this.model.page) {
        query.page = this.model.page
      }

      // Exposed filters.
      if (Object.entries(this.model.filter || {}).length) {
        query['views-filter'] = this.model.filter
      }

      // Exposed sorts.
      if (this.model.sort) {
        query['views-sort[sort_by]'] = this.model.sort
      }

      return query
    },

    /**
     * Filters update event handler.
     */
    onFiltersUpdate() {
      this.model.page = null
      this.model.sort = null
    },

    /**
     * Maps Vuex action to methods.
     */
    ...mapActions({
      getCollection: 'druxt/getCollection',
      getResource: 'druxt/getResource',
      getResults: 'druxt/views/getResults'
    })
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
    componentOptions: ({ displayId, uuid, viewId }) => ([[viewId || uuid, displayId]]),

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: (vm) => ({
      count: vm.count,
      display: vm.display,
      mode: vm.mode,
      pager: vm.pager,
      results: vm.results,
      view: vm.view
    }),

    /**
     * Provides the scoped slots object for the Module render function.
     *
     * - header
     * - filters
     * - sorts
     * - attachments_before
     * - results
     * - pager
     * - attachments_after
     * - default (all of the above)
     *
     * @example <caption>DruxtView**ViewId**.vue</caption> @lang vue
     * <template>
     *   <div>
     *     <slot name="header" />
     *     <slot name="results" />
     *     <slot name="pager" />
     *   </div>
     * </template>
     *
     * @return {ScopedSlots} The Scoped slots object.
     */
    slots(h) {
      // Build scoped slots.
      const scopedSlots = {}

      // Headers.
      scopedSlots.header = () => Object.entries(this.headers).map(([key, header]) => h('span', {
        domProps: { innerHTML: (header.content || {}).value }, key
      }))

      // Exposed filters.
      if (this.filters.length) {
        scopedSlots.filters = (attrs) => h('DruxtViewsFilters', {
          attrs: { ...attrs },
          on: {
            input: (value) => {
              this.model.filter = value
            }
          },
          ref: 'filters',
          props: {
            filters: this.filters,
            value: this.model.filter,
            ...(((this.display || {}).display_options || {}).exposed_form || {})
          },
        })
      }

      // Exposed sorts.
      if (this.showSorts) {
        scopedSlots.sorts = (attrs) => h('DruxtViewsSorts', {
          attrs: { ...attrs },
          on: {
            input: (value) => {
              this.model.sort = value
            }
          },
          ref: 'sorts',
          props: {
            sorts: this.sorts,
            value: this.model.sort,
            ...(((this.display || {}).display_options || {}).exposed_form || {})
          }
        })
      }

      // Attachments before.
      if (this.attachments_before) {
        scopedSlots.attachments_before = (attrs) => this.attachments_before.map((displayId) => h('DruxtView', {
          attrs: { ...attrs },
          key: displayId,
          ref: 'attachements_before',
          props: {
            displayId,
            type: this.type,
            uuid: this.uuid,
            viewId: this.viewId,
          },
        }))
      }

      // Results.
      scopedSlots.results = (attrs) => {
        if (!this.results.length) {
          return Object.values(this.display.display_options.empty)
            .filter((o) => o.plugin_id === 'text_custom')
            .map((empty) => {
              return h('div', { domProps: { innerHTML: empty.content } })
            })
        }

        return this.results.map((result) => h('DruxtEntity', {
          attrs: { ...attrs },
          key: result.id,
          props: {
            mode: this.mode,
            type: result.type,
            uuid: result.id
          }
        }))
      }

      // Pager.
      if (this.showPager) {
        scopedSlots.pager = (attrs) => h('DruxtViewsPager', {
          attrs: { ...attrs },
          on: {
            input: (value) => {
              this.model.page = value
            }
          },
          ref: 'pager',
          props: {
            count: this.count,
            resource: this.resource,
            value: this.model.page,
            ...this.pager,
          }
        })
      }

      // Attachments after.
      if (this.attachments_after) {
        scopedSlots.attachments_after = (attrs) => this.attachments_after.map((displayId) => h('DruxtView', {
          attrs: { ...attrs },
          key: displayId,
          ref: 'attachements_after',
          props: {
            displayId,
            type: this.type,
            uuid: this.uuid,
            viewId: this.viewId,
          },
        }))
      }

      // Build default slot.
      scopedSlots.default = (attrs) => Object.keys(scopedSlots)
        .filter((key) => !['default', '_normalized'].includes(key))
        .map((key) => scopedSlots[key](attrs))

      return scopedSlots
    },
  }
}

/**
 * Provides the available component naming options for the Druxt Wrapper.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtView[ViewId][DisplayId]',
 *   'DruxtView[ViewId]'
 * ]
 *
 * @example <caption>featured_articles (default)</caption> @lang js
 * [
 *   'DruxtViewFeaturedArticlesDefault',
 *   'DruxtViewFeaturedArticles'
 * ]
 */

/**
 * Provides settings for the View module, via the `nuxt.config.js` `druxt.views`
 * or the Wrapper component `druxt` object.
 *
 * @typedef {object} ModuleSettings
 * @param {boolean} bundleFilter - Whether to automatically detect Resource types to filter, based on the View `bundle` filter.
 * @param {string[]} fields - An array of fields to filter from the JSON:API Views Resource types.
 * @param {string[]} resourceTypes - An array of Resource types to be used by the Fields filter.
 *
 * @example @lang js
 * {
 *   bundleFilter: false,
 *   fields: [],
 *   resourceTypes: []
 * }
 *
 * @example @lang vue
 * <script>
 * export default {
 *   druxt: {
 *     query: {
 *       bundleFilter: false,
 *       fields: ['title']
 *       resourceTypes: ['node--article'],
 *     },
 *   }
 * }
 */

/**
 * Provides propsData for the DruxtWrapper.
 *
 * @typedef {object} PropsData
 * @param {integer} count - The total item count.
 * @param {object} display - The View Display object.
 * @param {string} mode - The View mode for the results entities.
 * @param {object} pager - The displays pager settings.
 * @param {object[]} results - The JSON:API Views results.
 * @param {object} view - The View JSON:API resource.
 *
 * @example @lang js
 * {
 *   count: 8,
 *   display: {},
 *   mode: 'card',
 *   pager: {
 *     options: {},
 *     type: 'mini',
 *   },
 *   results: [],
 *   view: {},
 * }
 */

/**
 * Provides scoped slots for use in the Wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} header - The View header.
 * @param {function} filters - The Exposed filters.
 * @param {function} sorts - The Exposed sorts.
 * @param {function} attachments_before - Views attached before current display.
 * @param {function} results - The results as DruxtEntity components, or empty results output.
 * @param {function} pager - The View pager.
 * @param {function} attachments_after - Views attached after current display.
 * @param {function} default - All of the above.
 *
 * @example @lang js
 * {
 *   header: () => {},
 *   filters: () => {},
 *   sorts: () => {},
 *   attachments_before: () => {},
 *   results: () => {},
 *   pager: () => {},
 *   attachments_after: () => {},
 *   default: () => {},
 * }
 *
 * @example <caption>DruxtView**ViewId**.vue</caption> @lang vue
 * <template>
 *   <div>
 *     <slot name="header" />
 *     <slot name="results" />
 *     <slot name="pager" />
 *   </div>
 * </template>
 */
</script>

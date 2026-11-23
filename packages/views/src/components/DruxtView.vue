<script>
import merge from 'deepmerge'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
import { parse, stringify } from 'qs'
import { mapActions } from 'vuex'

/**
 * The DruxtView component renders Drupal Views using configuration and
 * results provided by the Drupal View and the JSON:API Views module.
 *
 * The component renders slots for the View's headers, footers, entity results,
 * exposed sorts and filters, and supports contextual filters.
 *
 * @example @lang vue
 * <DruxtView display-id="block_1" view-id="promoted_items" />
 *
 * @example <caption>View with contextual filter</caption> @lang vue
 * <DruxtView
 *   :arguments="[entity.attributes.drupal_internal__nid]"
 *   display-id="block_1"
 *   view-id="articles_aside"
 * />
 *
 * @example <caption>DruxtView Wrapper component boilerplate</caption> @lang vue
 * <template>
 *   <DruxtDebug :json="results" />
 * </template>
 *
 * <script>
 * import { DruxtViewsViewMixin } from 'druxt-views'
 * export default {
 *   mixins: [DruxtViewsViewMixin]
 * }
 *
 * @example <caption>default slot (template injection)</caption> @lang vue
 * <DruxtView>
 *   <template #default="{ results }">
 *     <!-- Do whatever you want here -->
 *     <DruxtDebug :json="results" />
 *   </template>
 * </DruxtView>
 *
 * @see {@link https://druxtjs.org/explanation/component-resolution|Component resolution}
 */
export default {
  name: 'DruxtView',

  extends: DruxtModule,

  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * Views contextual filters.
     *
     * @type {array}
     * @default []
     *
     * @example
     * <DruxtView :arguments="[1, 2, 3]" display-id="block_1" view-id="articles_aside" />
     */
    arguments: {
      type: Array,
      default: () => [],
    },

    /**
     * The View Display ID.
     *
     * @type {string}
     * @default default
     *
     * @example
     * <DruxtView display-id="page_1" view-id="frontpage" />
     */
    displayId: {
      type: String,
      default: 'default',
    },

    /**
     * Module settings object.
     *
     * @type {ModuleSettings}
     * @default {}
     */
    settings: {
      type: Object,
      default: () => ({}),
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
     *
     * @example
     * <DruxtView uuid="f6c38097-d534-4bfb-87d9-09526fe44e9c" />
     */
    uuid: {
      type: String,
      default: null,
    },

    /**
     * The View ID.
     *
     * @type {string}
     *
     * @example
     * <DruxtView view-id="frontpage" />
     */
    viewId: {
      type: String,
      default: null,
    }
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

  fetchKey(getCounter) {
    const parts = ['DruxtView', this.viewId || this.uuid, this.displayId].filter((o) => o)
    return [...parts, getCounter(parts.join(':'))].join(':')
  },

  /** */
  computed: {
    /**
     * Whether the store still holds the results this view shows. A flush of
     * them, at any level, removes them.
     *
     * @type {boolean}
     */
    hasStoredResults() {
      if (!this.resource) return false
      const viewId = this.viewId || (((this.view || {}).data || {}).attributes || {}).drupal_internal__id
      // The views store is registered as one module named `druxt/views`.
      const results = ((((this.$store.state['druxt/views'] || {}).results || {})[viewId] || {})[this.displayId] || {})[this.lang] || {}
      return Object.values(results).includes(this.resource)
    },

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
      if (!(((this.view || {}).data || {}).attributes || {}).display) return {}

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
     * @type {object[]}
     */
    headers() {
      if (!this.display) return []

      return (this.display.display_options || {}).header || []
    },

    /**
     * The View mode for the results entities.
     *
     * @type {string}
     */
    mode() {
      if (!this.display || !this.display.display_options) return 'default'

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
    '$route.query'(to, from) {
      // A URL the view wrote itself is not a reset. The marker covers the next
      // change only, which is either that navigation or one that replaced it.
      const own = stringify(to || {}) === this.routeQuery
      this.routeQuery = undefined
      if (own) return

      // Each navigation brings a new query object, even one that changes only
      // the hash, so compare what the query holds.
      if (stringify(to || {}) === stringify(from || {})) return

      if (!Object.entries(to || {}).length) {
        this.model = {
          filter: {},
          page: null,
          sort: null,
        }
      }
    },

    arguments() {
      this.$fetch()
    },

    displayId() {
      this.$fetch()
    },

    'model.filter': {
      deep: true,
      handler(to) {
        // The watcher also runs when a parent replaces the model, even with the
        // same filter, so compare what the filter holds.
        const filter = JSON.stringify(to || {})
        if (filter === this.lastFilter) return
        this.lastFilter = filter

        // A filter change goes back to the first page, as a Drupal-rendered
        // view does when its exposed form is submitted. The page watcher's
        // $fetch() then joins this one.
        this.model.page = null
        this.updateRoute()
        this.$fetch()
      },
    },

    'model.page'(to, from) {
      if (to !== from) {
        this.updateRoute()
        this.$fetch()
      }
    },

    'model.sort'(to, from) {
      if (to !== from) {
        this.updateRoute()
        this.$fetch()
      }
    },

    uuid() {
      this.$fetch()
    },

    viewId() {
      this.$fetch()
    },
  },

  created() {
    // The filter last fetched for, kept off the reactive data.
    this.lastFilter = JSON.stringify(this.model.filter || {})

    // A flush of the results, such as `druxt/clearCache` on a sign-out, makes
    // the view fetch them again.
    // A change of view, display or language empties the slot it reads as
    // well, and their own watchers fetch for that.
    if (!this.$isServer) {
      // The view's own fetch replaces its results when it bypasses the cache.
      // That isn't a flush, so the watcher ignores changes while a fetch runs,
      // and fetchData checks for a flush when the fetch ends.
      const slot = () => [this.viewId, this.displayId, this.lang].join(':')
      this.$watch(() => [slot(), this.hasStoredResults], ([to, stored], [from, wasStored]) => {
        if (this._fetchPromise) return
        if (to === from && wasStored && !stored) this.fetchAgain()
      })
    }
  },

  mounted() {
    // If static, re-fetch data allowing for cache-bypass.
    // @TODO - Don't re-fetch in serverless configuration.
    if (this.$store.app.context.isStatic) {
      this.$fetch()
    }
  },

  methods: {
    /**
     * Fetches again once a running fetch settles, as after a flush. A running
     * fetch may have read the store before the flush emptied it.
     *
     * @return {Promise} The fetch.
     */
    async fetchAgain() {
      // Only Nuxt's fetch can fetch again.
      if (typeof this.$fetch !== 'function') return
      if (this._fetchPromise) await this._fetchPromise
      return this.$fetch()
    },

    /**
     * Updates the filter, page and sort the URL holds to the model's values.
     *
     * The model starts from the URL, so a URL that still names page 2 after a
     * filter change would open page 2 again on reload. Each of the three keys
     * the URL holds is changed to the model's value, or removed when the model
     * has none. A key the URL does not hold is never added, and the rest of the
     * query is kept as it is.
     */
    updateRoute() {
      if (!this.$router || !this.$route) return

      const current = this.$route.query || {}
      const keys = ['filter', 'page', 'sort']
      const owned = (key) => keys.some((name) => key === name || key.startsWith(`${name}[`))
      const held = keys.filter((name) => Object.keys(current).some((key) => key === name || key.startsWith(`${name}[`)))
      if (!held.length) return

      const query = Object.fromEntries(Object.entries(current).filter(([key]) => !owned(key)))
      const values = Object.fromEntries(held.map((key) => [key, this.model[key]]))
      // Flat, as Vue Router writes it: filter[difficulty]=easy.
      for (const pair of stringify(values, { skipNulls: true }).split('&').filter((o) => o)) {
        const [key, value] = pair.split('=').map(decodeURIComponent)
        if (value !== '') query[key] = value
      }

      if (stringify(query) === stringify(current)) return
      this.routeQuery = stringify(query)
      const navigation = this.$router.replace({ hash: this.$route.hash, query })
      // A newer navigation can cancel this one, which is not an error here.
      if (navigation && navigation.catch) navigation.catch(() => {})
    },

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

      // Contextual filters.
      if (this.arguments.length) {
        for (const index in this.arguments) {
          query[`views-argument[${index}]`] = this.arguments[index]
        }
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

  /** DruxtModule settings */
  druxt: {
    /**
     * Provides the available component naming options for the Druxt Wrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @param {string} context.displayId - The View Display ID.
     * @param {string} context.uuid - The View UUID.
     * @param {object} context.view - The View JSON:API resource data.
     * @param {string} context.viewId - The View ID.
     * @returns {ComponentOptions}
     */
    componentOptions: ({ displayId, uuid, view, viewId }) => ([
      [viewId || ((view.data || {}).attributes || {}).drupal_internal__id, displayId],
      [uuid || (view.data || {}).id, displayId],
      [displayId]
    ]),

    /**
     * Fetch View configuration resource.
     */
    async fetchConfig() {
      if (!this.view && (this.uuid || this.viewId)) {
        if (this.uuid) {
          this.view = await this.getResource({
            prefix: this.lang,
            type: this.type,
            id: this.uuid,
          })
        } else {
          const collection = await this.getCollection({
            prefix: this.lang,
            type: this.type,
            query: new DrupalJsonApiParams().addFilter('drupal_internal__id', this.viewId)
          })
          this.view = { data: collection.data[0] }
        }
      }
    },

    /**
     * Fetch JSON:API Views results.
     *
     * @param {object} settings - The module settings object, including the results query configuration.
     */
    async fetchData(settings) {
      const viewId = this.viewId || (((this.view || {}).data || {}).attributes || {}).drupal_internal__id
      if (viewId) {
        // Check if we need to bypass cache.
        let bypassCache = false
        if (typeof (settings.query || {}).bypassCache === 'boolean') {
          bypassCache = settings.query.bypassCache
        }

        // Build query.
        const query = this.getQuery(settings)

        // Execute the request.
        this.resource = await this.getResults({
          displayId: this.displayId,
          prefix: this.lang,
          query: stringify(query),
          viewId,
          bypassCache
        })

        // A flush while the request ran keeps the store from storing its
        // answer, which may be from before the flush, such as a signed-in
        // copy after a sign-out. Fetch once more, after this fetch settles.
        if (!this.$isServer && this.resource && !this.hasStoredResults) {
          if (!this._druxtFetchedAgain) {
            this._druxtFetchedAgain = true
            this.$nextTick(() => this.fetchAgain())
          }
        } else {
          this._druxtFetchedAgain = false
        }
      }
    },

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} vm - The module component ViewModel.
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
     * Component settings.
     *
     * @param {object} context - The module component ViewModel.
     * @param {object} wrapperSettings - Settings provided by the wrapper component.
     * @returns {object} The merged module settings.
     */
    settings: (context, wrapperSettings) => {
      const { $druxt, settings } = context

      // Start with the `nuxt.config.js` `druxt.settings.views` settings and
      // merge the Wrapper component settings on top.
      let mergedSettings = merge(($druxt.settings || {}).views || {}, wrapperSettings || {}, { arrayMerge: (dest, src) => src })
      // Merge the DruxtViews component `settings` property on top.
      mergedSettings = merge(mergedSettings || {}, settings || {}, { arrayMerge: (dest, src) => src })

      // Evaluate the bypass cache function.
      if (typeof (mergedSettings.query || {}).bypassCache === 'function') {
        mergedSettings.query.bypassCache = !!mergedSettings.query.bypassCache(context)
      }

      return {
        query: mergedSettings.query || {},
      }
    },

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
     * @param {Function} h - The Vue createElement function.
     * @return {ScopedSlots} The Scoped slots object.
     */
    slots(h) {
      // Build scoped slots.
      const scopedSlots = {}

      // Ensure an ID or UUID.
      if (!this.viewId && !this.uuid) {
        return {
          default: () => h(
            'DruxtDebug',
            { props: { summary: "Missing required 'uuid' or 'viewId' prop.", }},
            [h('p', "The DruxtView component requires either the 'uuid' or 'viewId' prop to be set.")]
          )
        }
      }

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
          ref: 'attachments_before',
          props: {
            displayId,
            langcode: this.lang,
            type: this.type,
            uuid: this.uuid,
            viewId: this.viewId,
          },
        }))
      }

      // Results.
      scopedSlots.results = (attrs) => {
        if (!this.results.length) {
          return Object.values(((this.display || {}).display_options || {}).empty || {})
            .filter((o) => o.plugin_id === 'text_custom')
            .map((empty) => {
              return h('div', { domProps: { innerHTML: empty.content } })
            })
        }

        return this.results.map((result) => h('DruxtEntity', {
          attrs: { ...attrs },
          key: result.id,
          props: {
            langcode: this.lang,
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
          ref: 'attachments_after',
          props: {
            displayId,
            langcode: this.lang,
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

    /**
     * Druxt development template tool configuration.
     */
    template: {
      debug: "{ view, results }",
      mixins: {
        'DruxtViewsViewMixin': 'druxt-views'
      }
    }
  }
}

/**
 * Provides the available component naming options for the Druxt Wrapper.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtView[ViewId][DisplayId][Langcode]',
 *   'DruxtView[ViewId][DisplayId]',
 *   'DruxtView[ViewId][Langcode]',
 *   'DruxtView[ViewId]',
 *   'DruxtView[UUID][DisplayId][Langcode]',
 *   'DruxtView[UUID][DisplayId]',
 *   'DruxtView[UUID][Langcode]',
 *   'DruxtView[UUID]',
 *   'DruxtView[DisplayId][Langcode]',
 *   'DruxtView[DisplayId]',
 * ]
 *
 * @example <caption>featured_articles (default)</caption> @lang js
 * [
 *   'DruxtViewFeaturedArticlesDefaultEn',
 *   'DruxtViewFeaturedArticlesDefault',
 *   'DruxtViewFeaturedArticlesEn',
 *   'DruxtViewFeaturedArticles',
 *   'DruxtView16f5d68e5bae4d7aa61c6b2bc3b6d3b6DefaultEn',
 *   'DruxtView16f5d68e5bae4d7aa61c6b2bc3b6d3b6Default',
 *   'DruxtView16f5d68e5bae4d7aa61c6b2bc3b6d3b6En',
 *   'DruxtView16f5d68e5bae4d7aa61c6b2bc3b6d3b6',
 *   'DruxtViewDefaultEn',
 *   'DruxtViewDefault',
 * ]
 */

/**
 * Provides settings for the View module, via the `nuxt.config.js` `druxt.views`
 * or the wrapper component `druxt` object.
 *
 * @typedef {object} ModuleSettings
 * @param {object} query - View results query settings:
 * @param {(boolean|function)} query.bypassCache - Whether to pull the data from the Vuex store or from the JSON:API.
 * @param {boolean} query.bundleFilter - Whether to automatically detect Resource types to filter, based on the View `bundle` filter.
 * @param {string[]} query.fields - An array of fields to filter from the JSON:API Views Resource types.
 * @param {string[]} query.resourceTypes - An array of Resource types to be used by the Fields filter.
 *
 * @example <caption>DruxtView Wrapper component</caption> @lang vue
 * <script>
 * export default {
 *   druxt: {
 *     query: {
 *       bypassCache: ({ $store }) => $store.$auth.loggedIn,
 *       bundleFilter: false,
 *       fields: [],
 *       resourceTypes: ['node--article'],
 *     },
 *   },
 * }
 *
 * @example <caption>DruxtView component with settings</caption> @lang vue
 * <template>
 *   <DruxtView
 *     display-id="block_1"
 *     view-id="promoted_items
 *     :settings="{
 *       query: {
 *         bypassCache: true,
 *         bundleFilter: false,
 *         fields: ['title']
 *         resourceTypes: [],
 *       }
 *     }"
 *   />
 * </template>
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
 * Provides scoped slots for use in the wrapper component.
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

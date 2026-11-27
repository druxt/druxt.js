<script>
import merge from 'deepmerge'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
import { parse, stringify } from 'qs'
import { mapActions } from 'vuex'

/**
 * Reads one pager's page from a `page` query value.
 *
 * Drupal keeps every pager on a page in one value, comma separated in pager ID
 * order, so `0,2` is page 2 for pager 1 and the first page for pager 0.
 *
 * @param {string} [value] - The `page` query value.
 * @param {number} id - The pager ID.
 * @return {number|null} The page, or `null` for the first page.
 */
const readPage = (value, id) => parseInt(String(value === undefined || value === null ? '' : value).split(',')[id]) || null

/**
 * Writes one pager's page into a `page` query value, keeping the others.
 *
 * @param {string} [value] - The `page` query value.
 * @param {number} id - The pager ID.
 * @param {number|null} page - The page, or `null` for the first page.
 * @return {string|undefined} The new value, or `undefined` when every pager is on its first page.
 */
const writePage = (value, id, page) => {
  const pages = value === undefined || value === null || value === '' ? [] : String(value).split(',')
  while (pages.length <= id) pages.push('0')
  pages[id] = String(page || 0)
  while (pages.length && !parseInt(pages[pages.length - 1])) pages.pop()
  return pages.length ? pages.join(',') : undefined
}

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
     * The URL query keys of the exposed filters: each filter's identifier, its
     * operator's when the operator is exposed, and a grouped filter's.
     *
     * Views on a page with the same identifier share its value, as they do
     * on a page Drupal renders.
     *
     * @type {string[]}
     */
    filterKeys() {
      return this.filters.reduce((keys, filter) => {
        const expose = filter.expose || {}
        return keys.concat([
          expose.identifier,
          expose.use_operator && expose.operator_id,
          filter.is_grouped && (filter.group_info || {}).identifier,
        ].filter((key) => key))
      }, [])
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
     * The pager ID, which is this view's place in the `page` URL query.
     *
     * @type {number}
     */
    pagerId() {
      return parseInt(((this.pager || {}).options || {}).id) || 0
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
    },

    /**
     * The IDs of the exposed sorts.
     *
     * @type {string[]}
     */
    sortIds() {
      return this.sorts.map((sort) => sort.id)
    },
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

      // A view kept out of the URL keeps its own values, whatever the URL holds.
      if ((this.component.settings || {}).route === false) return

      // Another view or a link changed the URL. A view that writes the URL
      // takes what it owns of it, such as a filter identifier it shares.
      if (this.view) {
        if (this.applyRoute(to, true)) this.$fetch()
        return
      }

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
      // Another display can own other parts of the URL, such as another
      // pager's place in `page`.
      if (((this.component || {}).settings || {}).route !== false && this.view && this.$route) {
        this.applyRoute(this.$route.query)
      }
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
        if (!this.fromRouteQuery) this.updateRoute()
        this.$fetch()
      }
    },

    'model.sort'(to, from) {
      if (to !== from) {
        if (!this.fromRouteQuery) this.updateRoute()
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
     * Sets the model to what this view owns of a URL query.
     *
     * @param {object} query - The URL query.
     * @param {boolean} [replace=false] - Whether to replace the model object, so a parent bound with `v-model` hears the change, rather than set its values.
     * @return {boolean} Whether the model changed.
     */
    applyRoute(query, replace = false) {
      const { filter, page, sort } = this.fromRoute(query)
      const json = JSON.stringify(filter)
      const changed = {
        filter: json !== JSON.stringify(this.model.filter || {}),
        page: page !== this.model.page,
        sort: sort !== this.model.sort,
      }
      if (!Object.values(changed).some((o) => o)) return false

      // The URL says which page goes with the filter, so the filter watcher
      // must not go back to the first one.
      this.lastFilter = json
      // The model watchers leave the URL alone for this change: it came from
      // the URL, which may spell the same values another way.
      this.fromRouteQuery = true
      this.$nextTick(() => { this.fromRouteQuery = false })
      if (replace) {
        this.model = { ...this.model, filter, page, sort }
        return true
      }
      if (changed.filter) this.model.filter = filter
      if (changed.page) this.model.page = page
      if (changed.sort) this.model.sort = sort
      return true
    },

    /**
     * Reads what this view owns of a URL query, as Drupal does for a view on a
     * page it renders. The page is in the pager's place in `page`, and a filter
     * value or sort counts only when the view exposes it.
     *
     * @param {object} query - The URL query.
     * @return {object} The `filter`, `page` and `sort` for the model.
     */
    fromRoute(query) {
      // Stringify and parse the query object to fix nested objects.
      const model = parse(stringify(query || {}))
      const filterKeys = this.filterKeys || []
      const sortIds = this.sortIds || []

      return {
        filter: Object.fromEntries(Object.entries(model.filter || {}).filter(([key]) => filterKeys.includes(key))),
        page: this.showPager ? readPage(model.page, this.pagerId || 0) : null,
        sort: sortIds.includes(model.sort) ? model.sort : null,
      }
    },

    /**
     * Writes the model's filter, page and sort to the URL query.
     *
     * The model starts from the URL, so writing it back means a reload or a
     * copied link opens the view as it is now. The view writes only what it
     * owns: its page, in its pager's place in `page` (`page=0,2` is page 2 of
     * pager 1), the values of its exposed filters, and its sort when it exposes
     * sorts. A value back at its default is removed. The rest of the query,
     * including other views' keys, is kept as it is, and `router.replace` keeps
     * the browser history to one entry.
     *
     * The `route` setting turns this off.
     */
    updateRoute() {
      if (!this.$router || !this.$route) return
      if ((this.component.settings || {}).route === false) return

      const current = this.$route.query || {}
      const query = { ...current }

      if (this.showPager) {
        const page = writePage(current.page, this.pagerId || 0, this.model.page)
        if (page === undefined) delete query.page
        else query.page = page
      }

      const filterKeys = this.filterKeys || []
      if (filterKeys.length) {
        // Flat, as Vue Router writes it: filter[difficulty]=easy.
        const flat = (values) => stringify(values, { skipNulls: true }).split('&').filter((o) => o)
          .map((pair) => pair.split('=').map(decodeURIComponent))
          .filter(([, value]) => value !== '')
        if (query.filter && typeof query.filter === 'object') {
          for (const [key, value] of flat({ filter: query.filter })) query[key] = value
          delete query.filter
        }

        const owned = (key) => filterKeys.some((id) => key === `filter[${id}]` || key.startsWith(`filter[${id}][`))
        for (const key of Object.keys(query)) {
          if (owned(key)) delete query[key]
        }
        const filter = Object.fromEntries(Object.entries(this.model.filter || {}).filter(([key]) => filterKeys.includes(key)))
        for (const [key, value] of flat({ filter })) query[key] = value
      }

      const sortIds = this.sortIds || []
      if (sortIds.length) {
        if (sortIds.includes(this.model.sort)) query.sort = this.model.sort
        else if (sortIds.includes(current.sort)) delete query.sort
      }

      // `$route` holds the query from before a pending write of the view's
      // own. A query equal to it is written too, so it replaces that write.
      const sorted = { sort: (a, b) => a.localeCompare(b) }
      if (this.routeQuery === undefined && stringify(query, sorted) === stringify(current, sorted)) return
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

      // Pagination, in the pager's place: page 2 of pager 1 is `page=0,2`.
      const page = writePage(undefined, this.pagerId || 0, this.model.page)
      if (page !== undefined) {
        query.page = page
      }

      // Contextual filters.
      if (this.arguments.length) {
        for (const index in this.arguments) {
          query[`views-argument[${index}]`] = this.arguments[index]
        }
      }

      // Exposed filters, the view's own.
      const filterKeys = this.filterKeys || []
      const filter = Object.fromEntries(Object.entries(this.model.filter || {}).filter(([key]) => filterKeys.includes(key)))
      if (Object.entries(filter).length) {
        query['views-filter'] = filter
      }

      // Exposed sorts, the view's own.
      if (this.model.sort && (this.sortIds || []).includes(this.model.sort)) {
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

        // With the display known, the view keeps only what it owns of the URL
        // it opened with.
        if (this.$route) this.applyRoute(this.$route.query)
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
        route: mergedSettings.route !== false,
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
            route: ((this.component || {}).settings || {}).route !== false,
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
 * @param {boolean} [route=true] - Whether the view writes its filter, page and sort to the URL query as they change.
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

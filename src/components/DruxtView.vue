<script>
import merge from 'deepmerge'
import { DruxtModule } from 'druxt'
import { parse, stringify } from 'qs'
import { mapActions } from 'vuex'

/**
 * The `<DruxtView />` Vue.js component.
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
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
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
      default: 'view--view'
    },

    /**
     * The View UUID.
     *
     * @type {string}
     */
    uuid: {
      type: String,
      required: true
    },

    /**
     * The View ID.
     *
     * @type {string}
     */
    viewId: {
      type: String,
      required: true
    }
  },

  /**
   * Nuxt fetch method.
   */
  async fetch() {
    if (!this.view) {
      this.view = await this.getResource({
        type: this.type,
        id: this.uuid,
      })
    }

    this.resource = await this.getResults({
      viewId: this.viewId,
      displayId: this.displayId,
      query: stringify(this.query)
    })

    await DruxtModule.fetch.call(this)
  },

  /**
   * Vue.js Data object.
   *
   * Used for on-demand JSON:API resource loading.
   *
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
      if (!this.display) return false

      if (!this.display.display_options.row.type.includes('entity:')) return false

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

    query() {
      const query = {}

      // Check all filters for 'bundle' plugin with bundle data, and use if
      // found to return only the UUID field.
      const filters = ((this.display || {}).display_options || {}).filters || []
      Object.values(filters).map((filter) => {
        if (filter.plugin_id === 'bundle' && filter.value) {
          Object.keys(filter.value).map((bundle) => {
            const resourceType = `${filter.entity_type}--${bundle}`
            query[`fields[${resourceType}]`] = 'uuid'
          })
        }
      })

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
     * The JSON:API Views results.
     *
     * @type {object}
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
          filter: null,
          page: null,
          sort: null,
        }
        await this.$fetch
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
  },

  methods: {
    getScopedSlots() {
      // Build scoped slots.
      const scopedSlots = {}

      // Headers.
      scopedSlots.header = () => Object.entries(this.headers).map(([key, header]) => this.$createElement('span', {
        domProps: { innerHTML: (header.content || {}).value }, key
      }))

      // Exposed filters.
      if (this.filters.length) {
        scopedSlots.filters = (attrs) => this.$createElement('DruxtViewsFilters', {
          attrs: { ...attrs },
          on: {
            input: (value) => {
              this.model.filter = value
            }
          },
          props: {
            filters: this.filters,
            value: this.model.filter,
            ...this.display.display_options.exposed_form
          },
        })
      }

      // Exposed sorts.
      if (this.showSorts) {
        scopedSlots.sorts = (attrs) => this.$createElement('DruxtViewsSorts', {
          attrs: { ...attrs },
          on: {
            input: (value) => {
              this.model.sort = value
            }
          },
          props: {
            sorts: this.sorts,
            value: this.model.sort,
            ...this.display.display_options.exposed_form
          }
        })
      }

      // Attachments before.
      if (this.attachments_before) {
        scopedSlots.attachments_before = (attrs) => this.attachments_before.map((displayId) => this.$createElement('DruxtView', {
          attrs: { ...attrs },
          key: displayId,
          props: {
            displayId,
            type: this.type,
            uuid: this.uuid,
            viewId: this.viewId,
          },
        }))
      }

      // Results.
      scopedSlots.results = (attrs) => this.results.map((result) => this.$createElement('DruxtEntity', {
        attrs: { ...attrs },
        key: result.id,
        props: {
          mode: this.mode,
          type: result.type,
          uuid: result.id
        }
      }))

      // Pager.
      if (this.showPager) {
        scopedSlots.pager = (attrs) => this.$createElement('DruxtViewsPager', {
          attrs: { ...attrs },
          on: {
            input: (value) => {
              this.model.page = value
            }
          },
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
        scopedSlots.attachments_after = (attrs) => this.attachments_after.map((displayId) => this.$createElement('DruxtView', {
          attrs: { ...attrs },
          key: displayId,
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
      getResource: 'druxt/getResource',
      getResults: 'druxt/views/getResults'
    })
  },

  druxt: {
    componentOptions: (vm) => ([[vm.viewId, vm.displayId]]),

    propsData: (vm) => ({
      count: vm.count,
      display: vm.display,
      mode: vm.mode,
      pager: vm.pager,
      results: vm.results,
      view: vm.view
    }),
  }
}
</script>

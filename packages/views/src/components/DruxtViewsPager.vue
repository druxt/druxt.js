<script>
import { DruxtModule } from 'druxt'

/**
 * The `<DruxtViewsPager />` Vue.js component.
 *
 * Renders a slot themable Views pager component.
 */
export default {
  name: 'DruxtViewsPager',

  extends: DruxtModule,

  /** */
  props: {
    /**
     * The JSON:API Views results total count.
     *
     * @type {integer}
     */
    count: {
      type: [Boolean, Number],
      default: false,
    },

    /**
     * The Pager options.
     *
     * @type {object}
     */
    options: {
      type: Object,
      default: () => ({}),
    },

    /**
     * The JSON:API Views results resource.
     *
     * @type {object}
     */
    resource: {
      type: Object,
      default: () => ({}),
    },

    /**
     * The Pager type.
     *
     * @type {string}
     */
    type: {
      type: String,
      default: 'none',
    },

    /**
     * The DruxtViewPager model value.
     *
     * @type {integer}
     */
    value: {
      type: Number,
      default: 0
    }
  },

  watch: {
    model(to, from) {
      if (to !== from) {
        this.$emit('input', this.model)
      }
    }
  },

  /** */
  methods: {
    /**
     * Get the query object from provided link.
     * 
     * @param {string} link - A url with querystring.
     * @returns {object}
     */
    getQuery(link) {
      const query = Object.fromEntries(new URLSearchParams(link.href.split('?')[1]))
      if (typeof query.page === 'string') query.page = parseInt(query.page)
      return query
    },

    /**
     * Get a Route object from provided link.
     *
     * @param {string} link - A url with querystring.
     * @returns {object}
     */
    getRoute(link) {
      const query = this.getQuery(link)
      return { query: { ...this.$route.query, page: query.page } }
    },

    /**
     * Set the model from provided link.
     * 
     * @param {string} link - A url with querystring.
     */
    setPage(link) {
      const query = this.getQuery(link)
      this.model = query.page
    }
  },

  /** DruxtModule settings */
  druxt: {
    /**
     * Provides the available component naming options for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {ComponentOptions}
     */
    componentOptions: ({ type }) => ([[type], ['default']]),

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: ({ count, options, resource, type, model }) => ({
      count: parseInt(count),
      options,
      resource,
      type,
      value: model
    }),

    /**
     * Provides the scoped slots object for the Module render function.
     * 
     * The `default` slot will render basic pagination based on the JSON:API links.
     *
     * @return {ScopedSlots} The Scoped slots object.
     */
    slots(h) {
      const self = this
      return {
        default: () => h('ul', [
          // Next.
          ((self.resource || {}).links || {}).prev && h('li', [
            h('NuxtLink', {
              nativeOn: {
                click() {
                  self.setPage(self.resource.links.prev)
                },
              },
              props: { to: self.getRoute(self.resource.links.prev) },
            }, [self.options.tags.previous]),
          ]),

          // Previous.
          ((self.resource || {}).links || {}).next && h('li', [
            h('NuxtLink', {
              nativeOn: {
                click() {
                  self.setPage(self.resource.links.next)
                },
              },
              props: { to: self.getRoute(self.resource.links.next) },
            }, [self.options.tags.next]),
          ]),
        ])
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
 *   'DruxtViewsPager[Type]',
 *   'DruxtViewsPager[Default]'
 * ]
 *
 * @example @lang js
 * [
 *   'DruxtViewsPagerFull',
 *   'DruxtViewsPagerDefault'
 * ]
 */

/**
 * Provides propsData for the DruxtWrapper.
 *
 * @typedef {object} PropsData
 * @param {integer} count - The JSON:API Views results total count.
 * @param {object} options - The Pager options.
 * @param {object} resource - The JSON:API Views results resource.
 * @param {string} type - The Pager type.
 * @param {integer} value - The DruxtViewPager model value.
 * 
 * @example @lang js
 * {
 *   count: 20,
 *   options: {
 *     expose: {},
 *     id: 0,
 *     items_per_page: 10,
 *     ...
 *   },
 *   resource: {
 *     data: [],
 *     jsonapi: {},
 *     links: {},
 *     meta: {},
 *   },
 *   type: 'full',
 *   value: 0,
 * }
 */

/**
 * Provides scoped slots for use in the Wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} default - A JSON:API resource links based pager.
 */
</script>

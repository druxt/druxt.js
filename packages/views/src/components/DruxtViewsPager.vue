<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

/**
 * Writes one pager's page into a `page` query value, keeping the others.
 *
 * Drupal keeps every pager on a page in one value, comma separated in pager ID
 * order, so `0,2` is page 2 for pager 1.
 *
 * @param {string} [value] - The `page` query value.
 * @param {number} id - The pager ID.
 * @param {number} page - The page.
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
 * Used by the DruxtView component to render a Druxt Wrapper themeable pager.
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

  computed: {
    /**
     * The pager ID, which is the pager's place in the `page` URL query.
     *
     * @type {number}
     */
    pagerId() {
      return parseInt((this.options || {}).id) || 0
    },
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
      if (typeof query.page === 'string') query.page = parseInt(query.page.split(',')[this.pagerId]) || 0
      return query
    },

    /**
     * Get a Route object from provided link.
     *
     * @param {string} link - A url with querystring.
     * @returns {object}
     */
    getRoute(link) {
      const { page } = this.getQuery(link)
      const query = { ...this.$route.query }

      // One pager, the page as a number.
      if (!this.pagerId && !String(query.page === undefined ? '' : query.page).includes(',')) {
        return { query: { ...query, page } }
      }

      // Several, each in its place, as Drupal writes them.
      const value = writePage(query.page, this.pagerId, page)
      if (value === undefined) delete query.page
      else query.page = value
      return { query }
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
     * @param {string} context.type - The Pager type.
     * @returns {ComponentOptions}
     */
    componentOptions: ({ type }) => ([[type], ['default']]),

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @param {boolean|number} context.count - The JSON:API Views results total count.
     * @param {object} context.options - The Pager options.
     * @param {object} context.resource - The JSON:API Views results resource.
     * @param {string} context.type - The Pager type.
     * @param {number} context.model - The DruxtViewsPager model value.
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
     * @param {Function} h - The Vue createElement function.
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
    },

    /**
     * Druxt development template tool configuration.
     */
    template: {
      debug: "{ count, options, resource, type, model }",
      mixins: {
        'DruxtViewsPagerMixin': 'druxt-views'
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
 *   'DruxtViewsPager[Type][Langcode]',
 *   'DruxtViewsPager[Type]',
 *   'DruxtViewsPager[Default][Langcode]',
 *   'DruxtViewsPager[Default]'
 * ]
 *
 * @example @lang js
 * [
 *   'DruxtViewsPagerFullEn',
 *   'DruxtViewsPagerFull',
 *   'DruxtViewsPagerDefaultEn',
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
 * Provides scoped slots for use in the wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} default - A JSON:API resource links based pager.
 */
</script>

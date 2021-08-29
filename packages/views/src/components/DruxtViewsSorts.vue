<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

/**
 * Used by the DruxtView component to render a Druxt Wrapper themeable sort.
 *
 * @example
 * <DruxtViewsSorts
 *   :options="{}"
 *   :sorts="[{}]"
 *   type="basic"
 * />
 */
export default {
  name: 'DruxtViewsSorts',

  extends: DruxtModule,

  /** */
  props: {
    /**
     * The Exposed form options.
     *
     * @type {object}
     */
    options: {
      type: Object,
      default: () => ({}),
    },

    /**
     * The Exposed Sort objects.
     *
     * @type {object[]}
     */
    sorts: {
      type: Array,
      default: () => ([]),
    },

    /**
     * The Exposed form type.
     *
     * @type {string}
     */
    type: {
      type: String,
      default: 'basic',
    },
  },

  watch: {
    model(to, from) {
      if (to !== from) {
        this.$emit('input', this.model)
      }
    }
  },

  methods: {
    /**
     * Returns a merged Route object with the provided sort.
     *
     * @param {string} sort - The sort ID.
     * @returns {object}
     */
    sortBy(sort) {
      return { query: { ...this.$route.query, ...{ sort: sort.id } } }
    },
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
    propsData: ({ model, options, sorts, type }) => ({ options, sorts, type, value: model }),

    /**
     * Provides the scoped slots object for the Module render function.
     *
     * The `default` slot will render a list of sorts.
     *
     * @return {ScopedSlots} The Scoped slots object.
     */
    slots(h) {
      const self = this
      return {
        default: () => h('div', [
          h('strong', [this.options.exposed_sorts_label]),
          h('ul', this.sorts.map((sort) => h('li', [
            h('NuxtLink', {
              nativeOn: {
                click() {
                  self.model = sort.id
                },
              },
              props: { to: this.sortBy(sort) },
            }, [sort.expose.label])
          ])))
        ]),
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
 *   'DruxtViewsSorts[Type]',
 *   'DruxtViewsSorts[Default]'
 * ]
 *
 * @example @lang js
 * [
 *   'DruxtViewsSortsBasic',
 *   'DruxtViewsSortsDefault'
 * ]
 */

/**
 * Provides propsData for the DruxtWrapper.
 *
 * @typedef {object} PropsData
 * @param {object} options - The Exposed form options.
 * @param {object[]} sorts - The Exposed Sort objects.
 * @param {string} type - The Exposed form type.
 * @param {integer} value - The DruxtViewSorts model value.
 *
 * @example @lang js
 * {
 *   options: {
 *     expose_sort_order: true,
 *     expose_sorts_label: 'Sort by',
 *     reset_button: false,
 *     ...
 *   },
 *   sorts: [{
 *     admin_label: '',
 *     expose: {},
 *     exposed: true,
 *     ...
 *   }],
 *   type: 'basic',
 *   value: undefined,
 * }
 */

/**
 * Provides scoped slots for use in the Wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} default - A list of sort links.
 */
</script>

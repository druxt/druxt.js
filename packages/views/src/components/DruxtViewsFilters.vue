<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

/**
 * Used by the DruxtView component to render a collection of Druxt Wrapper
 * themeable filters.
 */
export default {
  name: 'DruxtViewsFilters',

  extends: DruxtModule,

  /** */
  props: {
    /**
     * The Exposed Filter objects.
     *
     * @type {object[]}
     */
    filters: {
      type: Array,
      required: true,
    },

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
     * The Exposed form type.
     *
     * @type {string}
     */
    type: {
      type: String,
      default: 'basic',
    },

    /**
     * The DruxtViewFilters model value.
     *
     * @type {object}
     */
    value: {
      type: Object,
      default: () => ({}),
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
    propsData: ({ options, filters, model, type }) => ({ options, filters, type, value: model }),

    /**
     * Provides the scoped slots object for the Module render function.
     *
     * A scoped slot is provided for each filter.
     *
     * The `default` slot will render all filters.
     *
     * @example <caption>DruxtViewsFilters**Type**.vue</caption> @lang vue
     * <template>
     *   <div>
     *     <slot name="nid" />
     *   </div>
     * </template>
     *
     * @return {ScopedSlots} The Scoped slots object.
     */
    slots(h) {
      const scopedSlots = {}

      // Build scoped slots for each filter.
      this.filters.map((filter) => {
        scopedSlots[filter.expose.identifier] = (attrs) => h('DruxtViewsFilter', {
          attrs: { ...attrs, ...this.$attrs },
          props: {
            filter,
            value: this.model[filter.expose.identifier]
          },
          ref: filter.expose.identifier,
          on: {
            input: (value) => {
              this.model = { ...this.model, [filter.expose.identifier]: value }
            }
          }
        })
      })

      // Build default slot.
      scopedSlots.default = (attrs) => this.filters.map(
        (filter) => scopedSlots[filter.expose.identifier](attrs)
      )

      return scopedSlots
    },
  },
}

/**
 * Provides the available component naming options for the Druxt Wrapper.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtViewsFilters[Type][Langcode]',
 *   'DruxtViewsFilters[Type]',
 *   'DruxtViewsFilters[Default][Langcode]'
 *   'DruxtViewsFilters[Default]'
 * ]
 *
 * @example @lang js
 * [
 *   'DruxtViewsFiltersBasicEn',
 *   'DruxtViewsFiltersBasic',
 *   'DruxtViewsFiltersDefaultEn'
 *   'DruxtViewsFiltersDefault'
 * ]
 */

/**
 * Provides propsData for the DruxtWrapper.
 *
 * @typedef {object} PropsData
 * @param {object[]} filters - The Exposed Filter objects.
 * @param {object} options - The Exposed form options.
 * @param {string} type - The Exposed form type.
 * @param {object} value - The DruxtViewFilters model value.
 *
 * @example @lang js
 * {
 *   filters: [{
 *     admin_label: '',
 *     expose: {},
 *     exposed: true,
 *     ...
 *   }],
 *   options: {
 *     expose_sort_order: true,
 *     exposed_sorts_label: 'Sort by',
 *     reset_button: false,
 *     ...
 *   },
 *   type: 'basic',
 *   value: undefined,
 * }
 */

/**
 * Provides scoped slots for use in the Wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} [filter.expose.identifier] - Slot per filter.
 * @param {function} default - All filters.
 *
 * @example <caption>DruxtViewsFilters**Type**.vue</caption> @lang vue
 * <template>
 *   <div v-if="default">
 *     <slot />
 *   </div>
 *
 *   <div v-else>
 *     <slot name="type" />
 *   </div>
 * </template>
 */
</script>

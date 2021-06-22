<script>
import { DruxtModule } from 'druxt'

/**
 * The `<DruxtViewsFilters />` Vue.js component.
 *
 * Renders slot themable Exposed Views filters.
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

  druxt: {
    componentOptions: ({ type }) => ([[type], ['default']]),

    propsData: ({ options, filters, model, type }) => ({ options, filters, type, value: model }),

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
</script>

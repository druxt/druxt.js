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

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
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

  data() {
    return {
      model: { ...this.value }
    }
  },

  watch: {
    model: {
      deep: true,
      handler() {
        // Only emit 'input' if using the default 'DruxtWrapper' component.
        if (this.component.is === 'DruxtWrapper') {
          this.$emit('input', this.model)
        }
      }
    }
  },

  druxt: {
    componentOptions: ({ type }) => ([[type], ['default']]),

    propsData: ({ options, filters, type }) => ({ options, filters, type })
  },

  render(h) {
    const wrapperData = {
      class: this.wrapper.class || undefined,
      style: this.wrapper.style || undefined,
      props: this.wrapper.propsData,
    }

    // Build scoped slots for each filter.
    const scopedSlots = {}

    this.filters.map((filter) => {
      scopedSlots[filter.expose.identifier] = attrs => h('DruxtViewsFilter', {
        attrs: { ...attrs, ...this.$attrs },
        props: {
          filter,
          value: this.model[filter.expose.identifier]
        },
        on: {
          input: (value) => {
            this.model = { ...this.model, [filter.expose.identifier]: value }
          }
        }
      })
    })

    // Build default slot.
    scopedSlots.default = attrs => this.filters.map((filter) => scopedSlots[filter.expose.identifier](attrs))

    // Return wrapped component.
    return h(this.wrapper.component, wrapperData, [
      h(this.component.is, {
        attrs: this.$attrs,
        props: {
          ...this.component.propsData,
          value: this.model
        },
        scopedSlots,
        on: {
          input: value => {
            this.model = value
            this.$emit('input', this.model)
          }
        }
      })
    ])
  }
}
</script>

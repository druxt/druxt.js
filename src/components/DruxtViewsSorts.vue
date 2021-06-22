<script>
import { DruxtModule } from 'druxt'

/**
 * The `<DruxtViewsSorts />` Vue.js component.
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
    sortBy(sort) {
      return { query: { ...this.$route.query, ...{ sort: sort.id } } }
    },
  },

  druxt: {
    componentOptions: ({ type }) => ([[type], ['default']]),

    propsData: ({ options, sorts, type }) => ({ options, sorts, type }),

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
</script>

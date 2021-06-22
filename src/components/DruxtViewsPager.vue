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
     * @type {object}
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

  methods: {
    getQuery(link) {
      const query = Object.fromEntries(new URLSearchParams(link.href.split('?')[1]))
      if (typeof query.page === 'string') query.page = parseInt(query.page)
      return query
    },

    getRoute(link) {
      const query = this.getQuery(link)
      return { query: { ...this.$route.query, page: query.page } }
    },

    setPage(link) {
      const query = this.getQuery(link)
      this.model = query.page
    }
  },

  druxt: {
    componentOptions: ({ type }) => ([[type], ['default']]),

    propsData: (vm) => ({
      count: parseInt(vm.count),
      options: vm.options,
      resource: vm.resource,
      type: vm.type,
    }),

    slots(h) {
      const self = this
      return {
        default: () => h('ul', [
          ((this.resource || {}).links || {}).prev && h('li', [
            h('NuxtLink', {
              nativeOn: {
                click() {
                  self.setPage(self.resource.links.prev)
                },
              },
              props: { to: this.getRoute(this.resource.links.prev) },
            }, [this.options.tags.previous]),
          ]),
          ((this.resource || {}).links || {}).next && h('li', [
            h('NuxtLink', {
              nativeOn: {
                click() {
                  self.setPage(self.resource.links.next)
                },
              },
              props: { to: this.getRoute(this.resource.links.next) },
            }, [this.options.tags.next]),
          ]),
        ])
      }
    }
  }
}
</script>

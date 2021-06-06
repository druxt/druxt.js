<script>
import { DruxtModule } from 'druxt'
import { mapActions, mapState } from 'vuex'

/**
 * The `<DruxtBreadcrumb />` Vue.js component.
 *
 * @example @lang vue
 * <DruxtBreadcrumb />
 */
export default {
  name: 'DruxtBreadcrumb',

  extends: DruxtModule,

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * Show home crumb?
     *
     * @type {boolean}
     * @default false
     * @example @lang vue
     * <DruxtBreacrumb :home="false" />
     */
    home: {
      type: Boolean,
      default: true
    }
  },

  /**
   * Nuxt.js fetch method.
   */
  async fetch() {
    await this.fetchCrumbs()
    await DruxtModule.fetch.call(this)
  },

  /**
   * @property {objects[]} crumbs - The Breadcrumbs.
   */

  data: () => ({
    crumbs: [],
  }),

  /**
   * Vue.js Computed properties.
   *
   * @vue-computed {object} route The current Route.
   * @vue-computed {object} routes All available routes.
   */
  computed: {
    ...mapState({
      route: state => state.druxtRouter.route,
      routes: state => state.druxtRouter.routes
    })
  },

  /**
   * Nuxt.js watch property.
   */
  watch: {
    /**
     * Updates crumbs on Route change.
     */
    $route: async function() {
      await this.$fetch()
    }
  },

  methods: {
    async fetchCrumbs() {
      // If there is no route, stop here.
      if (!this.route || !Object.keys(this.route).length) return

      // If we are at the root and don't want a home crumb, stop here.
      if (this.$route.path === '/' && !this.home) return

      // Current route crumb.
      const crumbs = []
      if (this.route.label) {
        crumbs.push({ text: this.route.label })
      }

      // If we are at the root of the site, stop here.
      if (this.$route.path === '/') {
        this.crumbs = crumbs
        return
      }

      // Add crumbs for route parents.
      const paths = this.$route.path.split('/').filter(String)
      paths.pop()
      while (paths.length > 0) {
        const to = '/' + paths.join('/')

        let route
        try {
          route = await this.getRoute(to)
        } catch(err) {
          route = false
        }

        if (route.label) {
          crumbs.push({ to, text: route.label })
        }

        paths.pop()
      }

      // Home crumb.
      if (this.home) {
        crumbs.push({
          to: '/',
          text: 'Home'
        })
      }

      this.crumbs = crumbs.reverse()
    },

    /**
     * Provides the scoped slots object for the Module render function.
     *
     * The `default` slot renders crumbs as as list of NuxtLink's.
     *
     * @return {ScopedSlots} The Scoped slots object.
     */
    getScopedSlots() {
      // Build scoped slots for each field.
      const scopedSlots = {}

      // Build default slot.
      scopedSlots.default = () => this.$createElement('ul', this.crumbs.map((crumb) =>
        this.$createElement('li', [
          crumb.to
            ? this.$createElement('NuxtLink', { props: { to: crumb.to }}, [crumb.text])
            : crumb.text
        ])
      ))
      if (this.$scopedSlots.default) {
        scopedSlots.default = (attrs) => this.$scopedSlots.default({
          ...this.$options.druxt.propsData(this),
          ...attrs
        })
      }

      return scopedSlots
    },

    /**
     * Maps `druxtRouter/getRoute` Vuex action to `this.getRoute`.
     */
    ...mapActions({
      getRoute: 'druxtRouter/getRoute'
    })
  },

  /**
   * Druxt module function.
   */
  druxt: {
    componentOptions: ({}) => [['default']],
    propsData: ({ crumbs }) => ({ crumbs })
  },
}
</script>

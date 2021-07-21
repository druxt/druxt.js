<script>
import { DruxtModule } from 'druxt'
import { mapActions, mapState } from 'vuex'

/**
 * The `<DruxtBreadcrumb />` component uses the DruxtRouter module to build a
 * path based breadcrumb.
 *
 * @example @lang vue
 * <DruxtBreadcrumb />
 */
export default {
  name: 'DruxtBreadcrumb',

  extends: DruxtModule,

  /** */
  props: {
    /**
     * Show home crumb?
     *
     * @type {boolean}
     * @default true
     * @example @lang vue
     * <DruxtBreacrumb :home="false" />
     */
    home: {
      type: Boolean,
      default: true
    }
  },

  /**
   * The Nuxt Fetch hook.
   *
   * Fetches the breadcrumbs.
   */
  async fetch() {
    if (!this.value) {
      await this.fetchCrumbs()
    }
    await DruxtModule.fetch.call(this)
  },

  /** */
  computed: {
    /**
     * @property {objects[]} crumbs - The Breadcrumbs.
     */
    crumbs: ({ model }) => model,

    ...mapState({
      route: state => state.druxtRouter.route,
      routes: state => state.druxtRouter.routes
    })
  },

  /** */
  watch: {
    /**
     * Updates crumbs on Route change.
     */
    $route: async function() {
      await this.$fetch()
    }
  },

  methods: {
    /**
     * Fetch Crumbs
     */
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
        this.model = crumbs
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

      this.model = crumbs.reverse()
    },

    /**
     * Maps `druxtRouter/getRoute` Vuex action to `this.getRoute`.
     */
    ...mapActions({
      getRoute: 'druxtRouter/getRoute'
    })
  },

  /** DruxtModule settings */
  druxt: {
    /**
     * Provides the available component naming options for the Druxt Wrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {ComponentOptions}
     */
    componentOptions: ({}) => [['default']],

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: ({ model }) => ({ crumbs: model, value: model }),

    /**
     * Provides the scoped slots object for the Module render function.
     *
     * The `default` slot renders crumbs as a list of NuxtLink's.
     *
     * @return {ScopedSlots} The Scoped slots object.
     */
    slots() {
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

      return scopedSlots
    },
  },
}

/**
 * Provides the available naming options for the Wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtBreadcrumb[Default]',
 * ]
 *
 * @example @lang js
 * [
 *   'DruxtBreadcrumbDefault',
 * ]
 */

/**
 * Provides propsData for use in the Wrapper component.
 *
 * @typedef {object} PropsData
 * @param {objects[]} crumbs - The Breadcrumbs.
 * @param {objects[]} value - The Breadcrumbs value.
 *
 * @example @lang js
 * {
 *   crumbs: [{
 *     text: 'Home',
 *     to: '/',
 *   }],
 *   value: [{
 *     text: 'Home',
 *     to: '/',
 *   }],
 * }
 */

/**
 * Provides scoped slots for use in the Wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} default - Crumbs as a list of NuxtLink's.
 *
 * @example <caption>DruxtBreadcrumb**Default**.vue</caption> @lang vue
 * <template>
 *   <div>
 *     <slot />
 *   </div>
 * </template>
 */
</script>

<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
import { mapActions, mapState } from 'vuex'

/**
 * The DruxtBreadcrumb component renders a list of breadcrumbs based on the
 * active route.
 *
 * @example @lang vue
 * <DruxtBreadcrumb />
 *
 * @example @lang vue
 * <DruxtBreadcrumb path="/node/1" />
 *
 * @example <caption>DruxtBreadcrumb Wrapper component boilerplate</caption> @lang vue
 * <template>
 *   <DruxtDebug :json="crumbs" />
 * </template>
 *
 * <script>
 * import { DruxtBreadcrumbMixin } from 'druxt-breadcrumb'
 * export default {
 *   mixins: [DruxtBreadcrumbMixin]
 * }
 *
 * @example <caption>DruxtBreadcrumb with template injection</caption> @lang vue
 * <DruxtBreadcrumb>
 *   <template #default="{ crumbs }">
 *     <!-- Do whatever you want here -->
 *     <DruxtDebug :json="crumbs" />
 *   </template>
 * </DruxtBreadcrumb>
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
    },

    /**
     * The Decoupled router path.
     *
     * If not set, the Vue router value will be used instead.
     *
     * @type {string}
     *
     * @example @lang vue
     * <DruxtBreacrumb path="/node/1" />
     */
    path: {
      type: String,
      default: undefined
    }
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
    },

    home() {
      this.$fetch()
    },

    path() {
      this.$fetch()
    }
  },

  methods: {
    /**
     * Fetch Crumbs
     */
    async fetchCrumbs() {
      const path = this.path || this.$route.path
      let route = this.route
      if (path && path !== route.path) {
        route = await this.getRoute(path)
      }

      // If there is no route, throw an error.
      if (!route || !Object.keys(route).length) {
        throw new Error('No route data available.')
      }

      // If we are at the root and don't want a home crumb, stop here.
      if ((path === '/' || route.isHomePath) && !this.home) return

      // Current route crumb.
      const crumbs = []
      if (route.label) {
        crumbs.push({ text: route.label })
      }

      // If we are at the root of the site, stop here.
      if (path === '/' || route.isHomePath) {
        this.model = crumbs
        return
      }

      // Add crumbs for route parents.
      let addHome = true
      const paths = path.split('/').filter(String)
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

        // If this route is the home path, prevent a duplicate home item.
        if (route.isHomePath) {
          addHome = false
        }

        paths.pop()
      }

      // Add Home item.
      if (this.home && addHome) {
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
    componentOptions: () => [['default']],

    /**
     * Fetches the breadcrumbs.
     */
    async fetchConfig() {
      if (!this.value) {
        await this.fetchCrumbs()
      }
    },

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
      scopedSlots.default = () => this.$createElement('ul', (this.crumbs || []).map((crumb) =>
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

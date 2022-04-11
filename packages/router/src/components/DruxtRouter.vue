<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

/**
 * The DruxtRouter component renders a Drupal decoupled route, or path, using
 * the appropriate Druxt component.
 *
 * For instance, using the path `/node/1` would render a DruxtEntity component.
 *
 * The Vue router path will be used if not path is defined.
 *
 * @example <caption>Render using the Vue router path</caption> @lang vue
 * <DruxtRouter />
 *
 * @example <caption>Render a specified path</caption> @lang vue
 * <DruxtRouter path="/node/1" />
 *
 * @example <caption>Render the result of the model, bypasses Drupal backend</caption> @lang vue
 * <DruxtRouter v-model="route" />
 *
 * @example <caption>DruxtRouter Wrapper component boilerplate</caption> @lang vue
 * <template>
 *   <DruxtDebug :json="route" />
 * </template>
 *
 * <script>
 * import { DruxtRouterMixin } from 'druxt-router'
 * export default {
 *   mixins: [DruxtRouterMixin]
 * }
 *
 * @example <caption>DruxtRouter with template injection</caption> @lang vue
 * <DruxtRouter>
 *   <template #default="{ route }">
 *     <!-- Do whatever you want here -->
 *     <DruxtDebug :json="route" open />
 *   </template>
 * </DruxtRouter>
 */
export default {
  name: 'DruxtRouter',

  extends: DruxtModule,

  /**
   * Nuxt middleware; gets and sets the current route, and processes redirects.
   *
   * This can be disabled by setting the `druxt.router.middleware` option to
   * `false` in `nuxt.config.js`
   *
   * @example @lang js
   * export default {
   *   druxt: {
   *     router: {
   *       middleware: false
   *     }
   *   }
   * }
   */
  async middleware ({ $druxt, redirect, route, store }) {
    // Ensure Router middleware is enabled.
    if (typeof ($druxt.settings.router || {}).middleware !== 'undefined' && !$druxt.settings.router.middleware) {
      return
    }

    // Get and set the current route and redirect information.
    const result = await store.dispatch('druxtRouter/get', route.fullPath)

    // Process redirect.
    if (result.redirect) {
      redirect(result.redirect)
    }
  },

  /** */
  props: {
    /**
     * The Decoupled router path.
     *
     * If not set, the Vue router value will be used instead.
     *
     * @type {string}
     *
     * @example @lang vue
     * <DruxtRouter path="/node/1" />
     */
    path: {
      type: String,
      default: undefined,
    },

    /**
     * The Router object, used to determine the resolved route component.
     *
     * Setting this value will bypass the JSON:API.
     *
     * @type {object}
     * @model
     */
    value: {
      type: Object,
      default: () => undefined
    }
  },

  /**
   * @property {object} model - The model object.
   */
  data: ({ value }) => ({
    debug: {
      path: undefined,
    },
    model: value,
  }),

  /**
   * Nuxt head method.
   *
   * - Sets the page title.
   * - Sets the canonical link.
   *
   * @todo Improve metatag support.
   */
  head () {
    const head = {
      title: this.title,
      link: [
        {
          hid: 'canonical',
          rel: 'canonical',
          href: this.canonical || (this.route || {}).canonical
        }
      ]
    }

    if (this.metatags) {
      head.meta = this.metatags
    }

    return head
  },

  /** */
  computed: {
    /**
     * The route module.
     *
     * @type {string}
     */
    module: ({ route }) =>
      (route || {}).component && route.component.startsWith('druxt-') ? route.component.substring(6) : false,

    /**
     * The route object.
     *
     * @type {object}
     */
    route: ({ model }) => model,

    /**
     * Route title.
     * @type {boolean|string}
     * @default false
     */
    title: ({ route }) => (route || {}).label || false,

    /**
     * Route component property data.
     * @type {object|string}
     * @default false
     */
    props: ({ route }) => (route || {}).props || false,
  },

  /** */
  watch: {
    $route() {
      const path = this.$route.fullPath
      if (this.$store.state.druxtRouter.routes[path] && this.$store.state.druxtRouter.route !== this.$store.state.druxtRouter.routes[path]) {
        this.$store.commit('druxtRouter/setRoute', path)
      }
    },

    /**
     * Re-fetch on update to Path prop.
     */
    async path() {
      await this.$fetch()
    }
  },

  /** DruxtModule settings */
  druxt: {
    /**
     * Provides the available component naming options for the Druxt Wrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {ComponentOptions}
     */
    componentOptions: ({ module, route }) => [
      // @TODO - Add Path options.
      [module || 'error', route.isHomePath ? 'front' : 'not-front'],
      ['default']
    ],

    /**
     * Fetch the decoupled route.
     */
    async fetchConfig() {
      // Use the v-model value if provided.
      if (this.value) {
        return
      }

      // Get the route from the Drupal decoupled router module via the
      // druxtRouter store.
      // Use the Path prop or the Vue Router as the route to lookup.
      const path = this.debug.path || this.path || this.$route.fullPath
      const route = await this.$store.dispatch('druxtRouter/getRoute', path)
      this.model = route

      // If this the path is the active Vue route, set the active route in the
      // druxtRouter store for other modules to use.
      // This is also done when via the middleware if in use.
      const setActiveRoute = path === this.$route.fullPath
      if (setActiveRoute) {
        this.$store.commit('druxtRouter/setRoute', path)
      }
    },

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: ({ $route, path, model }) => ({
      path: path || $route.fullPath,
      route: model
    }),

    /**
     * Provides the scoped slots object for the Module render function.
     *
     * - **debug**: A Debug component with a Path override field.
     * - **default**: Default error handling.
     *
     * @example <caption>DruxtRouter**Module**.vue</caption> @lang vue
     * <template>
     *   <div>
     *     <slot name="debug" />
     *     {{ route.props }}
     *   </div>
     * </template>
     *
     * @return {ScopedSlots} The Scoped slots object.
     */
    slots(h) {
      const scopedSlots = {}

      // Provide defualt error message.
      if (this.model.error) {
        scopedSlots.default = () => h('div', [
          h('h1', [`Error ${this.model.error.statusCode}`]),
          h('p', [this.model.error.message]),
        ])
      }

      return scopedSlots
    }
  }
}

/**
 * Provides the available naming options for the Wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtRouter[Module][IsFront?]',
 *   'DruxtRouterDefault',
 * ]
 *
 * @example <caption>Entity route</caption> @lang js
 * [
 *   'DruxtRouterEntityFront',
 *   'DruxtRouterEntity',
 *   'DruxtRouterDefault',
 *   '',
 * ]
 */

/**
 * Provides property data for use in the Wrapper component.
 *
 * @typedef {object} PropsData
 * @param {string} path - The route path.
 * @param {object} route - The Decoupled Router object.
 *
 * @example @lang js
 * {
 *   path: '/',
 *   route: {
 *     canonical: 'https://demo-api.druxtjs.org/en/node',
 *     component: 'druxt-view',
 *     error: false,
 *     isHomePath: true,
 *     jsonapi: {},
 *     label: 'Home',
 *     props: {},
 *     redirect: false,
 *     resolvedPath: '/en/node',
 *     type: 'views',
 *   }
 * }
 */

/**
 * Provides scoped slots for use in the Wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} debug - A Debug component with a Path override field.
 * @param {function} default - Default error handling.
 *
 * @example <caption>DruxtRouter**Module**.vue</caption> @lang vue
 * <template>
 *   <div>
 *     <slot name="debug" />
 *     {{ route.props }}
 *   </div>
 * </template>
 */
</script>

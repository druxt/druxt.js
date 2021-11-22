<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

/**
 * The DruxtRouter component renders a Drupal decoupled route, or path, using
 * the appropriate Druxt component.
 *
 * `<DruxtRouter path="/" />`
 *
 * If no Path is specified, the Vue router path will be used by default.
 *
 * For instance, using the `/node/1` route would result in a DruxtEntity
 * component for the content in Drupal with the Node ID of 1.
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
 * @example <caption>Render via a template</caption> @lang vue
 * <DruxtRouter>
 *   <template #default="{ route }">
 *     <DruxtEntity v-bind="route.props" />
 *   </template>
 * </DruxtRouter>
 */
export default {
  name: 'DruxtRouter',

  extends: DruxtModule,

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

  data: ({ value }) => ({
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
    /**
     * Re-fetch on update to Path prop.
     */
    async path() {
      await this.$fetch()
    }
  },

  druxt: {
    componentOptions: ({ module, route }) => [
      // @TODO - Add Path options.
      [module || 'error', route.isHomePath ? 'front' : 'not-front'],
      ['default']
    ],

    async fetchConfig() {
      // Use the v-model value if provided.
      if (this.value) {
        return
      }

      // Use either the path prop or the Vue router full path to query the
      // decoupled router.
      const path = this.path || this.$route.fullPath
      const route = await this.$store.dispatch('druxtRouter/getRoute', path)
      this.model = route
    },

    propsData: ({ $route, path, model }) => ({
      path: path || $route.fullPath,
      route: model
    })
  }
}
</script>

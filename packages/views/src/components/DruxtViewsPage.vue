<script>
import { modelToLocation, normalizePage, routeToModel } from '../utils/pages'

/**
 * A Views page whose URL is its state.
 *
 * Registered by the Nuxt module for each pattern in `druxt.views.pages`.
 * The route gives the view its arguments, filter, page and sort through the
 * page's config, DruxtView fetches, and every change the view reports is
 * written back to the URL through the router, so back and forward replay
 * as model changes and nothing reloads.
 *
 * @example @lang js
 * // nuxt.config.js
 * export default {
 *   druxt: {
 *     views: {
 *       pages: {
 *         '/shop/:collection?': {
 *           viewId: 'products',
 *           displayId: 'page_1',
 *           arguments: ['collection'],
 *           filters: { brand: { query: 'brand' } },
 *           aliases: { collection: { women: '12' } },
 *         },
 *       },
 *     },
 *   },
 * }
 */
export default {
  name: 'DruxtViewsPage',

  provide() {
    return { druxtViewsPage: { link: this.link } }
  },

  data: () => ({
    // The location last asked of the router, until the route catches up.
    // DruxtView and its wrapper both report a change, and a second
    // navigation to the same place would cancel the first.
    pending: '',
  }),

  watch: {
    $route() {
      this.pending = ''
    },
  },

  /** */
  computed: {
    /**
     * The pattern the route was registered for.
     *
     * @type {string}
     */
    pattern: ({ $route }) => (($route || {}).meta || {}).druxtViewsPage,

    /**
     * The page's config, with defaults.
     *
     * @type {object}
     */
    config: ({ $druxtViewsPages, pattern }) =>
      pattern && ($druxtViewsPages || {})[pattern]
        ? normalizePage(pattern, $druxtViewsPages[pattern])
        : null,

    /**
     * The arguments, filter, page and sort the route describes.
     *
     * @type {object}
     */
    model: ({ config, $route }) => (config ? routeToModel(config, $route) : null),
  },

  /** */
  methods: {
    /**
     * A router location for a model. Query keys the page does not own are
     * kept from the current route.
     *
     * @param {object} model - The view's model, including `arguments`.
     * @returns {object} A router location.
     */
    locationFor(model) {
      return modelToLocation(this.config, this.pattern, model, this.$route)
    },

    /**
     * A link the pager can render: the current model with a page.
     *
     * @param {object} change - The change to the model.
     * @param {number} change.page - The page to link to.
     * @returns {object} A router location.
     */
    link({ page }) {
      return this.locationFor({ ...this.model, page })
    },

    /**
     * DruxtView reported a change: the URL follows it.
     *
     * @param {object} value - `{ filter, page, sort }`.
     */
    onInput(value) {
      const location = this.locationFor({ ...this.model, ...value })
      const same =
        location.path === this.$route.path &&
        JSON.stringify(location.query) === JSON.stringify(this.$route.query || {})
      if (same) return
      const key = JSON.stringify(location)
      if (key === this.pending) return
      this.pending = key
      const navigation = this.$router[this.config.history](location)
      // Vue Router rejects a navigation another one replaces; it is not an error here.
      if (navigation && navigation.catch) navigation.catch(() => {})
    },
  },

  render(h) {
    if (!this.config) {
      return h('DruxtDebug', { props: { summary: 'No Views page for this route.' } }, [
        h('p', `Add the pattern ${this.pattern || this.$route.path} to druxt.views.pages.`),
      ])
    }
    return h('DruxtView', {
      props: {
        viewId: this.config.viewId,
        displayId: this.config.displayId,
        arguments: this.model.arguments,
        value: {
          filter: this.model.filter,
          page: this.model.page,
          sort: this.model.sort,
        },
      },
      on: { input: this.onInput },
    })
  },
}
</script>

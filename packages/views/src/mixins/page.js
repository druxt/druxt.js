import { modelToLocation, normalizePage, routeToModel } from '../utils/pages'

/**
 * Vue.js mixin for a Views page: a View whose URL is its state.
 *
 * The route gives the view its arguments, filter, page and sort through the
 * page's config, and every change the view reports is written back to the
 * URL through the router, so back and forward replay as model changes and
 * nothing reloads.
 *
 * DruxtViewsPage uses it for each pattern in `druxt.views.pages`. A component
 * inside a page the site routes itself uses it with the same config in the
 * `page` prop, including the pattern its own route matches. Params in that
 * pattern that the config does not own, such as an item the page has open,
 * are kept on every change.
 *
 * @example @lang vue
 * <template>
 *   <DruxtView v-if="config" v-bind="viewProps" @input="onInput" />
 * </template>
 *
 * <script>
 * import { DruxtViewsPageMixin } from 'druxt-views'
 *
 * export default {
 *   mixins: [DruxtViewsPageMixin],
 * }
 * </script>
 */
const DruxtViewsPageMixin = {
  props: {
    /**
     * The page's config, as a pattern's entry in `druxt.views.pages` with
     * the pattern added. Without it, the route's registered pattern is used.
     *
     * @type {object}
     * @default null
     *
     * @example
     * <DruxtViewsPage :page="{
     *   pattern: '/how-to/troubleshooting/:issue?',
     *   viewId: 'docs_issues',
     *   filters: { area: { query: 'area' } },
     * }" />
     */
    page: {
      type: Object,
      default: null,
    },
  },

  data: () => ({
    // The location last asked of the router, until the route catches up.
    // DruxtView and its wrapper both report a change, and a second
    // navigation to the same place would cancel the first.
    pending: '',
  }),

  computed: {
    /**
     * The pattern the page's URL follows.
     *
     * @type {string}
     */
    pattern: ({ page, $route }) => (page ? page.pattern : (($route || {}).meta || {}).druxtViewsPage),

    /**
     * The page's config, with defaults.
     *
     * @type {object}
     */
    config: ({ page, pattern, $druxtViewsPages }) => {
      const found = page || (pattern && ($druxtViewsPages || {})[pattern])
      return found ? normalizePage(pattern, found) : null
    },

    /**
     * The arguments, filter, page and sort the route describes.
     *
     * @type {object}
     */
    model: ({ config, $route }) => (config ? routeToModel(config, $route) : null),

    /**
     * The props for DruxtView.
     *
     * @type {object}
     */
    viewProps: ({ config, model }) =>
      config
        ? {
            viewId: config.viewId,
            displayId: config.displayId,
            arguments: model.arguments,
            value: { filter: model.filter, page: model.page, sort: model.sort },
          }
        : null,
  },

  watch: {
    $route() {
      this.pending = ''
    },
  },

  provide() {
    return { druxtViewsPage: { link: this.link } }
  },

  methods: {
    /**
     * A router location for a model. Params and query keys the page does not
     * own are kept from the current route.
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
}

export { DruxtViewsPageMixin }

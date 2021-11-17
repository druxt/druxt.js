<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
import { mapState } from 'vuex'

/**
 * Renders a Druxt module router component based on the resolved route provided
 * by the Drupal Decoupled Router module.
 *
 * @example @lang vue
 * <DruxtRouter />
 */
export default {
  name: 'DruxtRouter',

  extends: DruxtModule,

  async middleware ({ isDev, isStatic, redirect, route, store, ssrContext }) {
    if (isStatic && !ssrContext && !isDev) {
      return
    }

    const result = await store.dispatch('druxtRouter/get', route.fullPath)

    // Process redirect.
    if (result.redirect) {
      redirect(result.redirect)
    }
  },

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
          href: this.canonical || this.route.canonical
        }
      ]
    }

    if (this.metatags) {
      head.meta = this.metatags
    }

    return head
  },

  /**
   * Vue.js Computed properties.
   *
   * @vue-computed {object} redirect The current Redirect, if applicable.
   * @vue-computed {object} route The current Route.
   */
  computed: {
    module: ({ route }) =>
      (route || {}).component && route.component.startsWith('druxt-') ? route.component.substring(6) : false,

    /**
     * Route title.
     * @type {boolean|string}
     * @default false
     */
    title: ({ route }) => route.label || false,

    /**
     * Route component property data.
     * @type {object|string}
     * @default false
     */
    props: ({ route }) => route.props || false,

    ...mapState({
      redirect: state => state.druxtRouter.redirect,
      route: state => state.druxtRouter.route
    })
  },

  druxt: {
    componentOptions: ({ module, route }) => [
      // @TODO - Add Path options.
      [module || 'error', route.isHomePath ? 'front' : 'not-front'],
      ['default']
    ],

    propsData: ({ route }) => ({ route })
  }
}
</script>

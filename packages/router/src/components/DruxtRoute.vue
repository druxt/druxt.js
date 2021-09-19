<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

/**
 * Renders a Druxt module router component based on the resolved route provided
 * by the Drupal Decoupled Router module.
 *
 * @example @lang vue
 * <DruxtRouter />
 */
export default {
  name: 'DruxtRoute',

  extends: DruxtModule,

  props: {
    path: {
      type: String,
      default() {
        return this.$route.fullPath
      }
    }
  },

  data: ({ value }) => ({
    model: {
      redirect: false,
      route: {},
      ...value
    },
  }),

  async fetch() {
    if (!this.value) {
      this.model = await this.$store.dispatch('druxtRouter/get', this.path)
    }

    await DruxtModule.fetch.call(this)
  },

  /** */
  computed: {
    module: ({ route }) =>
      (route || {}).component && route.component.startsWith('druxt-') ? route.component.substring(6) : false,

    redirect: ({ model }) => (model || {}).redirect || false,
    route: ({ model }) => (model || {}).route || {},
  },

  watch: {
    async path() {
      if (!this.value) {
        await this.$fetch()
      }
    }
  },

  druxt: {
    componentOptions: ({ module, route }) => [
      // @TODO - Add Path options.
      [module || 'error', (route || {}).isHomePath ? 'front' : 'not-front'],
      ['default']
    ],

    propsData: ({ route }) => ({ route })
  }
}
</script>

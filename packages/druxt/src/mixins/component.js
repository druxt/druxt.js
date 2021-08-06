import { DruxtClass } from 'druxt'
import DruxtWrapper from 'druxt/dist/components/DruxtWrapper.vue'

/**
 * @name DruxtComponentMixin
 * @deprecated
 * @private
 */
const DruxtComponentMixin = {
  components: { DruxtWrapper },

  /**
   * @property {Component} component - The wrapper component and propsData to be rendered.
   */
  data: () => ({
    component: {
      is: 'DruxtWrapper',
      options: [],
      propsData: {},
    },
  }),

  props: {
    wrapper: {
      type: Object,
      default: () => ({
        component: 'div',
        propsData: {},
      })
    }
  },

  /**
   * The Nuxt Fetch hook.
   *
   * Loads the Druxt module data and applies a wrapper component as required.
   *
   * **Important:** If your component has an existing `fetch` method, you must manually invoke
   * the `DruxtComponentMixin.fetch()` hook.
   *
   * @see {@link https://nuxtjs.org/api/pages-fetch/}
   *
   * @example @lang vue <caption>Manually invoking DruxtComponentMixin.fetch().</caption>
   * <script>
   * import { DruxtComponentMixin } from 'druxt'
   * export default {
   *   mixins: [DruxtComponentMixin],
   *
   *   async fetch {
   *     await DruxtComponentMixin.fetch.call(this)
   *   }
   * }
   * </script>
   */
  async fetch() {
    console.warn('DruxtComponentMixin is deprecated in favour of DruxtModule.')

    // TODO: check for this.$druxt plugin.
    const druxt = new DruxtClass()
    const moduleData = await druxt.getModuleData(this)

    this.component.propsData = moduleData.propsData || {}

    if (!moduleData.componentOptions) {
      return
    }

    const options = druxt.getComponents(this, moduleData.componentOptions, true)
    this.component.options = options.map(item => item.pascal)
    const available = options.filter(item => item.global)
    if (!available.length) {
      return
    }

    this.component.is = available[0].pascal
  },
}

export { DruxtComponentMixin }

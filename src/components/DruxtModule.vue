<script>
import { DruxtWrapper } from '..'
import { pascalCase, splitByCase } from 'scule'

/**
 * The DruxtModule base Vue.js component.
 *
 * @example @lang js
 * import { DruxtModule } from 'druxt'
 * export default {
 *   name: 'MyDruxtModule',
 *   extends: DruxtModule,
 *   druxt: {
 *     componentOptions: () => ([['wrapper']]),
 *     propsData: (ctx) => ({ prop: ctx.prop }),
 *   }
 * }
 */
export default {
  components: { DruxtWrapper },

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
   * the `DruxtModule.fetch()` hook.
   *
   * @example @lang js <caption>Manually invoking DruxtModule.fetch().</caption>
   * import { DruxtModule } from 'druxt'
   * export default {
   *   name: 'MyDruxtModule',
   *   extends: DruxtModule,
   *   async fetch {
   *     await DruxtModule.fetch.call(this)
   *   }
   *   druxt: {
   *     componentOptions: () => ([['wrapper']]),
   *     propsData: (ctx) => ({ prop: ctx.prop }),
   *   }
   * }
   */
  async fetch() {
    if (!(this.$options || {}).druxt) {
      return false
    }

    // Build wrapper component object.
    const options = this.getModuleComponents()
    const component = {
      is: (((options.filter(o => o.global) || [])[0] || {}).name || 'DruxtWrapper'),
      options: options.map(o => o.name) || [],
    }

    // Get wrapper data.
    const wrapperData = await this.getWrapperData(component.is)
    component.settings = wrapperData.druxt || {}

    // Process propsData.
    const propsData = this.getModulePropsData()
    component.propsData = propsData

    // Set component data.
    this.component = component
  },

  /**
   * @property {object} component - The wrapper component and propsData to be rendered.
   */
  data: () => ({
    component: {},
  }),

  methods: {
    /**
     * Get list of module wrapper components.
     *
     * @return {object[]}
     */
    getModuleComponents() {
      if (!(this.$options.druxt || {}).componentOptions) {
        return []
      }

      const options = this.$options.druxt.componentOptions.call(this, this)
      if (!options || !options.length) {
        return []
      }

      // Build list of available components.
      let components = []
      for (const set of options.filter(set => Array.isArray(set))) {
        const variants = []
        components = [...components, ...set.map(item => {
          // Build array of name parts.
          const parts = variants.length ? [...variants[0].parts] : []
          parts.push(pascalCase(splitByCase(item)))

          // Convert parts into a pascalCase component name.
          const name = pascalCase([this.$options.name, ...parts])

          // Check if component is globally registered.
          const global = !!this.$options.components[name]

          // Store set variant data to be used in next set item.
          variants.unshift({ global, name, parts })

          return { global, name, parts }
        })]
      }

      // Filter unique components.
      const unique = components.filter(((s) => (o) => !s.has(o.name) && s.add(o.name))(new Set))

      // Sort items by parts length.
      const sorted = unique.sort((a, b) => b.parts.length - a.parts.length)

      return sorted
    },

    /**
     * Get module propsData.
     *
     * @return {object}
     */
    getModulePropsData() {
      if (!(this.$options.druxt || {}).propsData) {
        return {}
      }
      return this.$options.druxt.propsData.call(this, this)
    },

    /**
     * Get default scoped slots.
     *
     * @return {object}
     */
    getScopedSlots() {
      return {
        default: () => this.$createElement('div', [JSON.stringify(this.component.propsData)])
      }
    },

    /**
     * Get wrapper component.
     *
     * @param {string} component - The Wrapper component name.
     *
     * @return {object}
     */
    async getWrapperData(component) {
      let wrapperData = { druxt: {}, props: {} }
      if (!this.$options.components[component]) {
        return wrapperData
      }

      // Get data from resolved component.
      if ((this.$options.components[component].options || {}).druxt) {
        wrapperData = this.$options.components[component].options
      }

      // Get data from unresolved component.
      else if (typeof this.$options.components[component] === 'function' && this._init) {
        wrapperData = (await this.$options.components[component]())
      }

      const { druxt, props } = wrapperData
      return { druxt, props }
    }
  },

  render(h) {
    const wrapperData = {
      class: this.wrapper.class || undefined,
      style: this.wrapper.style || undefined,
      props: this.wrapper.propsData,
    }

    // Return only wrapper if fetch state is still pending.
    if (this.$fetchState.pending) {
      return h(this.wrapper.component, wrapperData)
    }

    // Return wrapped component.
    return h(this.wrapper.component, wrapperData, [
      h(this.component.is, {
        attrs: this.$attrs,
        props: this.component.propsData,
        scopedSlots: this.getScopedSlots(),
      })
    ])
  }
}
</script>

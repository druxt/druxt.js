<script>
import { pascalCase, splitByCase } from 'scule'
import Vue from 'vue'
import { DruxtWrapper } from '..'

/**
 * The DruxtModule base Vue.js component.
 *
 * Extend this component to build a Druxt module.
 *
 * @example @lang js
 * import { DruxtModule } from 'druxt'
 * export default {
 *   name: 'DruxtTestModule',
 *   extends: DruxtModule,
 *   druxt: {
 *     componentOptions: () => ([['wrapper']]),
 *     propsData: (ctx) => ({
 *       bar: ctx.bar,
 *       foo: ctx.foo,
 *     }),
 *   }
 * }
 */
export default {
  components: { DruxtWrapper },

  /** */
  props: {
    /**
     * The module value.
     *
     * @type {(Array|Boolean|Date|Number|Object|String)}
     * @model
     */
    value: {
      type: [Array, Boolean, Date, Number, Object, String],
      default: null,
    },

    wrapper: {
      type: Object,
      default: () => ({
        component: 'div',
        propsData: {},
      })
    },
  },

  /**
   * Loads the Druxt module data and applies a wrapper component as required.
   *
   * **Important:** If your component has an existing `fetch` method, you must manually invoke
   * the `DruxtModule.fetch()` hook.
   *
   * @example @lang js <caption>Manually invoking DruxtModule.fetch().</caption>
   * import { DruxtModule } from 'druxt'
   * export default {
   *   name: 'DruxtTestModule',
   *   extends: DruxtModule,
   *   async fetch() {
   *     await DruxtModule.fetch.call(this)
   *   }
   *   druxt: {
   *     componentOptions: () => ([['wrapper']]),
   *     propsData: (ctx) => ({
   *       bar: ctx.bar,
   *       foo: ctx.foo,
   *     }),
   *   }
   * }
   */
  async fetch() {
    if (!(this.$options || {}).druxt) {
      return false
    }

    // Build wrapper component object.
    const options = this.getModuleComponents()
    let component = {
      is: (((options.filter(o => o.global) || [])[0] || {}).name || 'DruxtWrapper'),
      options: options.map(o => o.name) || [],
    }

    // Get scoped slots.
    component.slots = Object.keys(this.getScopedSlots())

    // Get wrapper data.
    const wrapperData = await this.getWrapperData(component.is)
    component.settings = wrapperData.druxt || {}

    // Build wrapper component propsData.
    component = { ...component, ...this.getModulePropsData(wrapperData.props) }

    // Set component data.
    this.component = component
  },

  /**
   * @property {ComponentData} component - The wrapper component and propsData to be rendered.
   * @property {object} model - The model object.
   */
  data: ({ value }) => ({
    component: {
      $attrs: {},
      is: 'DruxtWrapper',
      options: [],
      props: {},
      propsData: {},
      settings: {},
      slots: [],
    },
    model: value,
  }),

  /** */
  methods: {
    /**
     * Get list of module wrapper components.
     *
     * @returns {Components}
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
     * Get module propsData via modules `druxt.propsData()` callback.
     *
     * @example @lang js
     * {
     *   bar: 'foo',
     *   foo: 'bar',
     * }
     *
     * @return {object}
     */
    getModulePropsData(wrapperProps = {}) {
      if (!(this.$options.druxt || {}).propsData) {
        return {}
      }

      const propsData = this.$options.druxt.propsData.call(this, this)

      // Props.
      const props = {}
      const propsKeys = Object.keys(wrapperProps).filter(i => Object.keys(propsData).includes(i))
      for (const key of propsKeys) {
        props[key] = propsData[key]
      }

      // $attrs.
      const $attrs = { ...this.$attrs }
      delete $attrs['data-fetch-key']
      const $attrsKeys = Object.keys(propsData).filter(i => !Object.keys(wrapperProps).includes(i))
      for (const key of $attrsKeys) {
        $attrs[key] = propsData[key]
      }

      return { $attrs, props, propsData }
    },

    /**
     * Gets a Druxt modules scoped slots, and if there's no default slots,
     * provides a develop mode debug default or passes through to a 
     * default template.
     *
     * @return {object}
     */
    getScopedSlots() {
      const h = this.$createElement
      const scopedSlots = typeof (this.$options.druxt || {}).slots === 'function'
        ? this.$options.druxt.slots.call(this, h)
        : {}

      // Pass through default scoped slot if provided.
      if (typeof this.$scopedSlots.default === 'function') {
        scopedSlots.default = (attrs) => this.$scopedSlots.default({
          ...((this.$options.druxt || {}).propsData || (() => {}))(this),
          ...attrs
        })
      }

      // Provide debug data if Nuxt is running in dev mode.
      if (!scopedSlots.default && this.$nuxt.context.isDev)  {
        scopedSlots.default = () => h(
          'details',
          {
            style: {
              border: '2px dashed lightgrey',
              margin: '0.5em 0',
              padding: '1em',
            },
          },
          [
            h('summary', [`[${this.$options._componentTag}] Missing default slot.`]),
            h('label', ['Component options:', h('ul', this.component.options.map((s) => h('li', [s])))]),
            h('br'),
            h('label', ['propsData:', h('pre', [h('code', [JSON.stringify(this.component.propsData, null, '\t')])])])
          ]
        )
      }

      return scopedSlots
    },

    /**
     * Get wrapper component data.
     *
     * @param {string} component - The Wrapper component name.
     *
     * @return {WrapperData}
     */
    async getWrapperData(component) {
      let wrapperData = { druxt: {}, props: {} }
      if (!this.$options.components[component]) {
        return wrapperData
      }

      // Get data from resolved component.
      if (this.$options.components[component].options) {
        wrapperData = this.$options.components[component].options
      }

      // Get data from unresolved component.
      else if (typeof this.$options.components[component] === 'function' && this._init) {
        wrapperData = (await this.$options.components[component].call(this)) || {}
      }

      const options = Vue.util.mergeOptions({}, wrapperData)
      return {
        druxt: options.druxt || {},
        props: options.props || {},
      }
    }
  },

  watch: {
    model() {
      if (this.component.props.value !== this.model) {
        this.component.props.value = this.model
       
        // Only emit 'input' if using the default 'DruxtWrapper' component.
        if (this.component.is === 'DruxtWrapper') {
          this.$emit('input', this.model)
        }
      }
    },

    value() {
      if (this.value !== this.model) {
        this.model = this.value
      }
    }
  },

  render(h) {
    const self = this

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
        attrs: { ...this.component.$attrs, ...this.$attrs },
        on: {
          input(value) {
            self.model = value
            self.$emit('input', value)
          }
        },
        props: this.component.props,
        ref: 'component',
        scopedSlots: this.getScopedSlots(),
      })
    ])
  }
}

/**
 * @typedef {object[]} Components
 * @property {boolean} global - Component global registration state.
 * @property {string} name - The component name.
 * @property {string[]} parts - The component naming parts.
 *
 * @example @lang js
 * [{
 *   global: true,
 *   pascal: 'DruxtTestModuleWrapper',
 *   parts: ['Wrapper'],
 * }]
 */

/**
 * @typedef {object} ComponentData
 * @property {object} $attrs - propsData not registered by the Wrapper component.
 * @property {string} is=DruxtWrapper - The Wrapper component name.
 * @property {string[]} options - The Wrapper component options.
 * @property {object} props - propsData registered by the Wrapper component.
 * @property {object} propsData - The component propsData object.
 * @property {object} settings - Druxt settings object provided by the Wrapper component.
 *
 * @example @lang js
 * {
 *   $attrs: { bar: 'foo' },
 *   is: 'DruxtTestModuleWrapper',
 *   options: [
 *     'DruxtTestModuleWrapper',
 *   ],
 *   props: { foo: 'bar' },
 *   propsData: {
 *     bar: 'foo',
 *     foo: 'bar',
 *   },
 *   settings: { fooBar: true },
 * }
 */

/**
 * @typedef {object} WrapperData
 * @property {object} druxt - Druxt settings object for use by Druxt module.
 * @property {object} props - Registered props oject.
 *
 * @example @lang js
 * {
 *   druxt: { fooBar: true },
 *   props: {
 *     foo: {
 *       type: String,
 *       default: '',
 *     }
 *   }
 * }
 */
</script>

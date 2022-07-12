<script>
import { pascalCase, splitByCase } from 'scule'
import Vue from 'vue'

import DruxtWrapper from './DruxtWrapper.vue'

/**
 * The DruxtModule component is used to make a Druxt module, simply import and
 * extend the component to get started.
 *
 * The component provides access to the Druxt Wrapper theming and fetch system
 * via the druxt settings object.
 *
 * @example @lang js
 * import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
 * export default {
 *   name: 'DruxtTestModule',
 *   extends: DruxtModule,
 *   druxt: {
 *     async fetchConfig() {},
 *     async fetchData(settings) {},
 *     componentOptions: (context) => ([[context.foo, context.bar, 'default']]),
 *     propsData: (context) => ({
 *       foo: context.foo,
 *       bar: context.bar,
 *     }),
 *     slots(h) {
 *       return {
 *         default: (attrs) => h('DruxtDebug', ['Hello world'])
 *       }
 *     }
 *   }
 * }
 */
export default {
  components: { DruxtWrapper },

  /** */
  props: {
    /**
     * The resource langcode.
     *
     * @example
     * <DruxtModule langcode="en" />
     *
     * @type {String}
     */
    langcode: {
      type: String,
      default: undefined
    },

    /**
     * The module component model value.
     *
     * Used to bypass the Drupal JSON:API fetch, setting the module data
     * directly.
     *
     * @example
     * <DruxtModule v-model="{ foo: bar }" />
     *
     * @type {(Array|Boolean|Date|Number|Object|String)}
     * @model
     */
    value: {
      type: [Array, Boolean, Date, Number, Object, String],
      default: null,
    },

    /**
     * The wrapper component configuration.
     *
     * Used to set the wrapper component, class, style and propsData.
     *
     * @example
     * <DruxtModule
     *   :wrapper="{
     *     component: 'MyWrapper',
     *     class: 'wrapper',
     *     propsData: { foo: 'bar' }
     *   }"
     * />
     *
     * @type {(Boolean|Object)}
     */
    wrapper: {
      type: [Boolean, Object],
      default: () => undefined
    },
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

  /**
   * Loads the Druxt module data and applies a wrapper component as required.
   *
   * **Important:** If your component has an existing `fetch` method, you must manually invoke
   * the `DruxtModule.fetch()` hook.
   *
   * @example @lang js <caption>Manually invoking DruxtModule.fetch().</caption>
   * import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
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

    // Fetch configuration.
    if ((this.$options.druxt || {}).fetchConfig) {
      try {
        await this.$options.druxt.fetchConfig.call(this)
      } catch(err) {
        return this.error(err)
      }
    }

    // Build wrapper component object.
    let options = []
    const hasDefaultTemplate = !!(((this.$vnode || {}).data || {}).scopedSlots || {}).default
    // Load wrapper components if:
    if (
      // No default template and wrapper isn't false OR
      (!hasDefaultTemplate && this.wrapper !== false) ||
      // Default tempalte and wrapper is set
      (hasDefaultTemplate && this.wrapper)
    ) {
      options = this.getModuleComponents()
    }
    let component = {
      is: (((options.filter(o => o.global) || [])[0] || {}).name || 'DruxtWrapper'),
      options: options.map(o => o.name) || [],
    }

    // Get wrapper data.
    const wrapperData = await this.getWrapperData(component.is)

    // Build module settings.
    component.settings = wrapperData.druxt || {}
    if ((this.$options.druxt || {}).settings) {
      component.settings = this.$options.druxt.settings(this, component.settings)
    }

    // Fetch resource.
    if ((this.$options.druxt || {}).fetchData) {
      try {
        await this.$options.druxt.fetchData.call(this, component.settings)
      } catch(err) {
        return this.error(err, { component })
      }
    }

    // Get scoped slots.
    component.slots = Object.keys(this.getScopedSlots())

    // Build wrapper component propsData.
    component = { ...component, ...this.getModulePropsData(wrapperData.props) }

    // Set component data.
    this.component = component
  },

  computed: {
    lang: ({ langcode, $route }) => langcode || ($route.meta || {}).langcode
  },

  watch: {
    lang(to, from) {
      if (to !== from) {
        this.$fetch()
      }
    },

    model() {
      if (this.component.props && this.component.props.value !== this.model) {
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

  /** */
  methods: {
    /**
     * Sets the component to render a DruxtDebug error message.
     */
    error(err, context = {}) {
      // Build error details.
      const { url } = err.druxt || {}
      const title = (err.response || {}).statusText || ((((err.response || {}).data || {}).errors || [])[0] || {}).title
      const summary = (err.response || {}).status
        ? [(err.response || {}).status, title].filter((s) => s).join(': ')
        : err.message

      // Set the component to a Debug component with error details.
      this.component = {
        ...context.component || {},
        is: 'DruxtDebug',
        props: {
          json: {
            url,
            errors: ((err.response || {}).data || {}).errors
          },
          summary
        }
      }
    },

    /**
     * Get list of module wrapper components.
     *
     * @returns {Components}
     */
    getModuleComponents() {
      // Ensure that the Druxt module component has `druxt.componentOptions`.
      if (!(this.$options.druxt || {}).componentOptions) {
        return []
      }
      const options = this.$options.druxt.componentOptions.call(this, this)

      // Ensure that there available component options are returned.
      if (!(options || []).length) {
        return []
      }

      // Build list of available components.
      let components = []
      for (const set of options.filter(set => Array.isArray(set))) {
        const variants = []

        // Add langcode suffix to all sets.
        // console.log('SET', set)
        // set.push(this.lang)

        for (const item of set.filter((o) => o)) {
          // Build array of name parts.
          const parts = variants.length ? [...variants[0].parts] : []
          parts.push(pascalCase(splitByCase(item)))

          // Convert parts into a pascalCase component name.
          const name = pascalCase([this.$options.name, ...parts])

          // Store set variant data to be used in next set item.
          variants.unshift({ global, name, parts })

          // Add langcode suffixed component option.
          if (this.lang) {
            const langcodeName = pascalCase([this.$options.name, ...parts, this.lang])
            components.push({
              global: !!this.$options.components[langcodeName],
              name: langcodeName,
              parts: [...parts, this.lang]
            })
          }

          // And component option.
          components.push({
            global: !!this.$options.components[name],
            name,
            parts
          })
        }
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

      const propsData = {
        langcode: this.lang,
        ...this.$options.druxt.propsData.call(this, this)
      }

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

      // Get an array of unmet required props.
      const required = Object.entries(this.$options.props)
        .filter(([k, o]) => o.required && !this[k])
        .map(([k]) => k)
      // Return debug error if any missing props are found.
      if (required.length) {
        return {
          default: () => h('DruxtDebug', { props: { summary: `Missing required props: ${required.join(', ')}.` } })
        }
      }

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
        if (!scopedSlots.debug) {
          scopedSlots.debug = () => h(
            'DruxtDebug',
            { props: { summary: 'Missing default slot' } },
            [
              h('label', ['Component options:', h('ul', this.component.options.map((s) => h('li', [s])))]),
              h('label', ['propsData:', h('pre', [h('code', [JSON.stringify(this.component.propsData, null, '  ')])])])
            ]
          )
        }
        scopedSlots.default = scopedSlots.debug
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

  render(h) {
    const self = this

    const wrapperData = {
      class: (this.wrapper || {}).class || undefined,
      style: (this.wrapper || {}).style || undefined,
      props: (this.wrapper || {}).propsData || undefined,
    }

    // Return only wrapper if fetch state is still pending and Druxt hasn't set
    // the available component options.
    if (this.$fetchState.pending && !this.component.options.length) {
      return h((this.wrapper || {}).component || 'div', wrapperData)
    }

    // Prepare attributes.
    const attrs = { ...this.component.$attrs, ...this.$attrs }
    delete attrs['data-fetch-key']

    // Unwrap default template based component if required.
    if ((this.$scopedSlots.default && !this.wrapper) || this.wrapper === false) {
      this.component.is = 'DruxtWrapper'
    }

    // Return component.
    return h((this.wrapper || {}).component || 'div', wrapperData, [
      h(this.component.is, {
        attrs,
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

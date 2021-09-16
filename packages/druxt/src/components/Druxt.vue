<script>
/**
 * Utility component for rendering Druxt modules.
 *
 * @example @lang vue
 * <Druxt
 *   :module="module"
 *   :props-data="propsData"
 *   :wrapper="{
 *     component,
 *     propsData: {}
 *   }"
 * />
 */
export default {
  name: 'Druxt',

  /**
   * Vue.js Props.
   */
  props: {
    /**
     * Inner element.
     *
     * @type {object}
     * @default { component: 'div', propsData: {} }
     */
    inner: {
      type: [Object, Boolean],
      default: () => ({
        component: 'div',
        propsData: {},
      })
    },

    /**
     * The DruxtJS module to render.
     *
     * @type {string}
     *
     * @example @lang vue <caption>Using the [DruxtJS Site module](https://site.druxtjs.org).</caption>
     * <Druxt module="site" />
     */
    module: {
      type: String,
      required: true,
    },

    /**
     * Props data to bind to the specified DruxtJS module.
     *
     * @type {object}
     *
     * @example @lang vue <caption>Using the [DruxtJS Entity module](https://entity.druxtjs.org) to render a 'node--article' resource.</caption>
     * <Druxt
     *   module="entity"
     *   :props-data="{
     *     mode: 'teaser',
     *     type: 'node--article',
     *     uuid
     *   }"
     * />
     */
    propsData: {
      type: Object,
      default: () => ({})
    },

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

    /**
     * Wrapper element.
     *
     * @type {object}
     * @default { component: 'div', propsData: {} }
     */
    wrapper: {
      type: [Object, Boolean],
      default: () => ({
        component: 'div',
        propsData: {},
      })
    },
  },

  /**
   * Vue.js Data object.
   *
   * @property {objects} components - The module and wrapper components settinsg.
   * @property {object} model - The model object.
   */
  data: ({ value }) => ({
    component: {
      is: undefined,
      propsData: {},
    },
    model: value,
  }),

  watch: {
    model() {
      if (this.value !== this.model) {
        this.$emit('input', this.model)
      }
    },

    value() {
      if (this.value !== this.model) {
        this.model = this.value
      }
    }
  },

  created() {
    this.setModuleComponent()
  },

  methods: {
    /**
     * Sets the module component and propsData.
     */
    setModuleComponent() {
      const component = `Druxt${this.module.split('-').map(string => string.charAt(0).toUpperCase() + string.slice(1)).join('')}`
      if (!this.$options.components[component]) {
        return
      }

      // Set component data.
      this.component.is = component
      this.component.propsData = this.propsData
    },
  },

  render(h) {
    const component = h(this.component.is, {
      props: {
        ...{ wrapper: this.inner },
        ...this.component.propsData,
        ...this.$attrs,
        value: this.model,
      },
      ref: 'module',
    })

    if ((this.wrapper || {}).component) {
      return h(this.wrapper.component, { props: this.wrapper.propsData }, [component])
    }

    return component
  }
}
</script>

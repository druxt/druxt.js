<template>
  <!-- Wrapped. -->
  <component
    :is="(wrapper || {}).component"
    v-if="wrapper && wrapper.component"
    v-bind="(wrapper || {}).propsData"
  >
    <component
      :is="component.is"
      v-bind="{
        ...component.propsData,
        ...$attrs
      }"
    />
  </component>

  <!-- Unwrapped. -->
  <component
    :is="component.is"
    v-else
    v-bind="{
      ...component.propsData,
      ...$attrs
    }"
  />
</template>

<script>
/**
 * The Vue.js Druxt component.
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
     * Wrapper theming system.
     *
     * @type {object}
     * @default { component: undefined, propsData: {} }
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
   * @property {objects} components - The module and wrapper components settins.
   */
  data: () => ({
    component: {
      is: undefined,
      propsData: {},
    },
  }),

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
}
</script>

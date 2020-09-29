<template>
  <component
    :is="components.module.component"
    :wrapper="components.wrapper"
    ref="module"
    v-bind="components.module.propsData"
  />
</template>

<script>
import { DruxtWrapperMixin } from '../mixins/wrapper'

/**
 * @example @lang vue
 * <druxt
 *   module="entity"
 *   :props-data="{
 *     mode: 'card_common',
 *     type: 'node--recipe',
 *     uuid
 *   }"
 *   :wrapper="{
 *     component,
 *     propsData: {}
 *   }"
 * />
 */
export default {
  name: 'Druxt',

  mixins: [DruxtWrapperMixin],

  props: {
    module: {
      type: String,
      default: undefined,
    },

    propsData: {
      type: Object,
      default: () => ({})
    },
  },

  data: () => ({
    components: {
      module: {
        component: 'div',
        propsData: {},
      },

      wrapper: {
        component: 'div',
        options: [],
        propsData: {}
      }
    },

    moduleData: undefined
  }),

  created() {
    this.updateModuleComponent()
  },

  methods: {
    /**
     * Get component data from available options.
     *
     * @param {string[]} options - The component naming options.
     * @param {boolean} [all=false] - Returns all options if true, else only globally registered options.
     * @param {string} [prefix] - A string to prefix all components.
     */
    getComponents(options, all = false, prefix) {
      const results = []

      options
        // Filter out incorrectly typed items.
        .filter(item => Array.isArray(item))

        // Process each item.
        .map(item => {
          const variants = []

          item.map(string => {
            const last = variants.length ? variants[variants.length - 1] : {}
            const parts = last.parts ? last.parts.slice(0) : []
            parts.push(string)

            const clone = parts.slice(0)

            // Attach prefix as required.
            if (typeof prefix !== 'string' && (prefix !== false || typeof prefix === 'undefined') && this.module) {
              prefix = `druxt-${this.module}`
            }

            if (prefix) {
              clone.unshift(prefix)
            }

            // Generate component name values.
            const kebab = clone.map(string => string.toLowerCase().replace(/--|_/g, '-')).join('-')
            const pascal = kebab.replace(/((\b|[^a-zA-Z0-9]+)[a-zA-Z0-9])/gi, (match, p1, p2) => match.toUpperCase().replace(p2, ''))

            // Check if component is globally registered.
            let global = false
            for (name of [kebab, pascal]) {
              if (typeof this.$options.components[name] !== 'undefined') {
                global = true
                break
              }
            }

            variants.unshift({ global, kebab, parts, pascal, prefix })
          })

          // Add variants to results.
          variants.map(variant => results.push(variant))
        })

      // Return globally registered components or all.
      return results.filter(option => option.global || !!all)
    },

    /**
     * Get the Druxt module data from the referenced component.
     */
    async getModuleData() {
      // Load Druxt module data for defined module.
      const vm = this.$refs.module
      if (!vm.$options || typeof vm.$options.druxt !== 'function') {
        return false
      }

      this.moduleData = await vm.$options.druxt({ vm })
      return this.moduleData
    },

    /**
     * Set a component.
     *
     * @param {string} type - The component type.
     * @param {string} component - The component name.
     * @param {object} propsData - The component propert data object.
     */
    setComponent(type, component, propsData = {}) {
      this.components[type] = {
        ...this.components[type],

        component,
        propsData
      }
    },

    /**
     * Update the Module component.
     */
    updateModuleComponent() {
      if (!this.module) {
        return
      }

      this.setComponent('module', `druxt-${this.module}`, this.propsData)
    },

    /**
     * Update the Wrapper component.
     */
    async updateWrapperComponent() {
      const moduleData = await this.getModuleData()

      // Update wrapper options.
      if (moduleData && moduleData.componentOptions) {
        const options = this.getComponents(moduleData.componentOptions, true)
        this.components.wrapper.options = options ? options : [{}]
      }

      // Set wrapper component from Druxt 'wrapper' property if defined.
      if (this.wrapper.component) {
        this.setComponent('wrapper', this.wrapper.component, this.wrapper.propsData)
        return
      }

      // Get first available registered component.
      let component
      const available = this.components.wrapper.options.filter(option => option.global)
      if (!available.length) {
        return
      }
      component = available[0].pascal

      // Merge propsData from module options and user defined values.
      const propsData = {
        ...this.wrapper.propsData,
        ...moduleData.propsData
      }

      this.setComponent('wrapper', component, propsData)
    }
  },

  watch: {
    'components.module': 'updateWrapperComponent',
    'module': 'updateModuleComponent',
    'propsData': 'updateModuleComponent',
    'wrapper': 'updateWrapperComponent',
  }
}
</script>

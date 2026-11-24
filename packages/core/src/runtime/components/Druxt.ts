import { pascalCase, splitByCase } from 'scule'
import { defineComponent, h, resolveDynamicComponent } from 'vue'
import type { Component, PropType } from 'vue'
import { consola } from 'consola'
import type { WrapperOption } from '../props'
import { reportUnknownModule } from '../utils/unknown'

/**
 * Renders any Druxt module by name.
 *
 * `module="entity"` renders DruxtEntity, and `module="block-region"` renders DruxtBlockRegion. `propsData` becomes
 * the module's props.
 *
 * It is useful where the module is data, such as in a page builder. Unlike 1.x, it renders no element of its own
 * unless `wrapper` names one.
 *
 * @example @lang vue
 * <Druxt module="entity" :props-data="{ type: 'node--page', uuid }" />
 *
 * @example <caption>With v-model</caption> @lang vue
 * <Druxt v-model="menu" module="menu" :props-data="{ name: 'main' }" />
 *
 * @example <caption>Inside an element, with the module's own wrapper set</caption> @lang vue
 * <Druxt
 *   module="view"
 *   :props-data="{ viewId: 'recipes' }"
 *   :wrapper="{ component: 'section', propsData: { class: 'recipes' } }"
 *   :inner="false"
 * />
 */
export default defineComponent({
  name: 'Druxt',

  // The attributes go to the module, below. Inherited too, they would also land on the element around it.
  inheritAttrs: false,

  /** The module, its props, and the elements around it. */
  props: {
    /**
     * The module's name, in kebab-case or camelCase: `entity`, `block-region`, `view`.
     *
     * @example @lang vue
     * <Druxt module="block-region" :props-data="{ name: 'header', theme: 'umami' }" />
     */
    module: { type: String, required: true },
    /**
     * The module's props.
     *
     * @example @lang vue
     * <Druxt module="entity" :props-data="{ type: 'node--article', uuid, mode: 'teaser' }" />
     */
    propsData: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
    /** The module's own `wrapper` option. The module's default applies when this is not set. */
    inner: { type: [Object, Boolean] as PropType<WrapperOption | boolean>, default: undefined },
    /** An element around the module, as `{ component, propsData }`. None by default. */
    wrapper: { type: [Object, Boolean] as PropType<{ component?: string, propsData?: Record<string, unknown> } | boolean>, default: false },
    /** The module's `v-model`. */
    modelValue: { type: [Array, Boolean, Date, Number, Object, String] as PropType<unknown>, default: undefined },
  },

  emits: ['update:modelValue'],

  /** The module's component, resolved from its name. */
  computed: {
    /** The module's component name. `entity` gives `DruxtEntity`. */
    componentName(): string {
      return `Druxt${pascalCase(splitByCase(this.module))}`
    },
  },

  render() {
    const component = resolveDynamicComponent(this.componentName)
    // Vue resolves an unregistered name to the name itself, as a string.
    if (typeof component === 'string') {
      // DruxtDebug renders in development only. So a production server logs the name instead, once.
      if (import.meta.server && !import.meta.dev) reportUnknownModule(this.module, this.componentName, (message) => consola.withTag('druxt').warn(message))
      return h(resolveDynamicComponent('DruxtDebug') as Component, { summary: `No Druxt module named '${this.module}': ${this.componentName} is not registered.` })
    }

    const model = this.modelValue
    const module = h(component as Component, {
      ...this.propsData,
      ...this.$attrs,
      ...(this.inner === undefined ? {} : { wrapper: this.inner }),
      ...(model === undefined ? {} : { modelValue: model }),
      'onUpdate:modelValue': (value: unknown) => this.$emit('update:modelValue', value),
    }, this.$slots)

    const wrapper = this.wrapper
    return typeof wrapper === 'object' && wrapper.component
      ? h(resolveDynamicComponent(wrapper.component) as Component | string, { ...wrapper.propsData }, [module])
      : module
  },
})

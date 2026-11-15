import { pascalCase, splitByCase } from 'scule'
import { defineComponent, h, resolveDynamicComponent } from 'vue'
import type { Component, PropType } from 'vue'
import { consola } from 'consola'
import type { WrapperOption } from '../props'
import { reportUnknownModule } from '../utils/unknown'

/**
 * Renders any Druxt module by name: `module="entity"` renders DruxtEntity,
 * `module="block-region"` DruxtBlockRegion, with `propsData` as its props.
 *
 * Useful where the module is data, such as a page builder. Unlike 1.x, it
 * renders no element of its own unless `wrapper` names one.
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

  /** The module, its props, and the elements around it. */
  props: {
    /**
     * The module's name, kebab-case or camelCase: `entity`, `block-region`, `view`.
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
    /** The module's own `wrapper` option; its default when not set. */
    inner: { type: [Object, Boolean] as PropType<WrapperOption | boolean>, default: undefined },
    /** An element around the module, `{ component, propsData }`. None by default. */
    wrapper: { type: [Object, Boolean] as PropType<{ component?: string, propsData?: Record<string, unknown> } | boolean>, default: false },
    /** The module's v-model. */
    modelValue: { type: [Array, Boolean, Date, Number, Object, String] as PropType<unknown>, default: undefined },
  },

  emits: ['update:modelValue'],

  /** The module's component, resolved from its name. */
  computed: {
    /** The module's component name: `entity` is DruxtEntity. */
    componentName(): string {
      return `Druxt${pascalCase(splitByCase(this.module))}`
    },
  },

  render() {
    const component = resolveDynamicComponent(this.componentName)
    // An unregistered name resolves to the name itself.
    if (typeof component === 'string') {
      // DruxtDebug renders in development only, so a production server logs the name once.
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
    })

    const wrapper = this.wrapper
    return typeof wrapper === 'object' && wrapper.component
      ? h(resolveDynamicComponent(wrapper.component) as Component | string, { ...wrapper.propsData }, [module])
      : module
  },
})

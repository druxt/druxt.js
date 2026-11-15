import type { PropType } from 'vue'

/** An element around a module: `{ component, class, style, propsData }`. */
export interface WrapperOption {
  component?: string
  class?: unknown
  style?: unknown
  propsData?: Record<string, unknown>
}

/** The props every Druxt module shares, as useDruxtModule() reads them. */
export interface DruxtModuleProps {
  langcode?: string
  modelValue?: unknown
  wrapper?: boolean | WrapperOption
}

/** The props every Druxt module shares; spread them into a module's own. */
export const druxtModuleProps = {
  /**
   * The resource langcode; the route's langcode when not set.
   *
   * @example @lang vue
   * <DruxtRouter path="/node/1" langcode="es" />
   */
  langcode: { type: String, default: undefined },
  /**
   * The module's v-model. A default of `undefined` keeps Vue from casting it to `false`.
   *
   * @example @lang vue
   * <DruxtRouter v-model="route" />
   */
  modelValue: { type: [Array, Boolean, Date, Number, Object, String] as PropType<unknown>, default: undefined },
  /**
   * An element around the module, or `false` for no wrapper component at all.
   *
   * @example @lang vue
   * <DruxtRouter :wrapper="{ component: 'section', class: 'route' }" />
   */
  wrapper: { type: [Boolean, Object] as PropType<boolean | WrapperOption>, default: undefined },
} as const

/** The events every Druxt module emits. */
export const druxtModuleEmits: ['update:modelValue'] = ['update:modelValue']

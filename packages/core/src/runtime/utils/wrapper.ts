import type { Component } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOptions = Record<string, any>
export type PropOptions = Record<string, { required?: boolean, [key: string]: unknown }>

/**
 * Vue props, array or object form, as an object.
 *
 * @param props - Component props.
 */
export const propsObject = (props: unknown): PropOptions => Array.isArray(props)
  ? Object.fromEntries(props.map((key: string) => [key, {}]))
  : { ...(props as PropOptions || {}) }

/**
 * A component's props and `druxt` settings, through its `extends` and `mixins`.
 *
 * @param component - A resolved component definition.
 */
export const collectOptions = (component: AnyOptions = {}): { druxt: Record<string, unknown>, props: PropOptions } => {
  const parents = [component.extends, ...(component.mixins || [])].filter(Boolean).map((parent) => collectOptions(parent as AnyOptions))
  return {
    druxt: Object.assign({}, ...parents.map((o) => o.druxt), component.druxt || {}),
    props: Object.assign({}, ...parents.map((o) => o.props), propsObject(component.props)),
  }
}

/**
 * Whether a component declares an event, through its `extends` and `mixins`.
 *
 * @param component - A component definition.
 * @param name - The event name.
 */
export const declaresEmit = (component: AnyOptions | undefined, name: string): boolean => {
  if (!component) return false
  const emits = component.emits || []
  if (Array.isArray(emits) ? emits.includes(name) : name in emits) return true
  return [component.extends, ...(component.mixins || [])].some((parent) => declaresEmit(parent as AnyOptions, name))
}

/**
 * Whether a wrapper declares it has no root element of its own, through its `extends` and `mixins`: the module then
 * renders its element around the wrapper, so the module's classes and a site's attributes land on that one element.
 *
 * @param component - A component definition.
 */
export const declaresRootless = (component: AnyOptions | undefined): boolean => {
  if (!component) return false
  if (component.druxtRootless === true) return true
  return [component.extends, ...(component.mixins || [])].some((parent) => declaresRootless(parent as AnyOptions))
}

/**
 * A wrapper's definition, with its declared props and `druxt` settings.
 *
 * @example @lang js
 * {
 *   component: DruxtEntityNodeArticleDefault,
 *   druxt: { query: { fields: ['title', 'body'] } },
 *   props: { entity: { type: Object, required: true } },
 * }
 */
export interface WrapperDefinition {
  component?: AnyOptions
  druxt: Record<string, unknown>
  props: PropOptions
}

/**
 * Reads a wrapper, loading it first if it is an async component, as Nuxt
 * registers global components. `__asyncLoader` is internal to Vue;
 * test/unit/wrapper.test.ts pins it.
 *
 * @param registered - The registered component, if any.
 */
export const readWrapper = async (registered: Component | undefined): Promise<WrapperDefinition> => {
  let component = registered as AnyOptions | undefined
  if (!component) return { druxt: {}, props: {} }
  if (typeof component.__asyncLoader === 'function') {
    const loaded = await component.__asyncLoader()
    component = (loaded.default || loaded) as AnyOptions
  }
  return { component, ...collectOptions(component) }
}

/**
 * The props a wrapper declares, from a module's propsData. Nothing else is
 * delivered, so no module data reaches the wrapper's root as attributes.
 *
 * @param propsData - What the module hands its wrapper.
 * @param declared - The props the wrapper declares.
 */
export const pickProps = (propsData: Record<string, unknown>, declared: string[]): Record<string, unknown> =>
  Object.fromEntries(declared.filter((key) => key in propsData).map((key) => [key, propsData[key]]))

declare module 'vue' {
  interface ComponentCustomOptions {
    /**
     * Declares that the wrapper renders no root element of its own, as Druxt's bundled block wrappers do. The module
     * renders its element around it, carrying the module's classes and anchors and the attributes the site set.
     */
    druxtRootless?: boolean
  }
}

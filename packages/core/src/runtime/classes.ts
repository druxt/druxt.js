import { useNuxtApp } from '#imports'
import type { NuxtApp } from '#app'
import { composeDruxtClassHooks, resolveDruxtClasses } from '@druxt/core/classes'
import type { DruxtClassContext, DruxtClassHook, DruxtClassPolicy } from '@druxt/core/classes'
import { useDruxtSettings } from './settings'

// The hooks each app registered, in order. Per app, so one server render never sees another's.
const hooks = new WeakMap<NuxtApp, DruxtClassHook[]>()

/**
 * Registers a function that rewrites Druxt's classes, such as mapping them to a utility framework's. Call it in a
 * plugin: a function cannot live in the runtime config. Several hooks run in the order they were registered, each
 * given the last one's list.
 *
 * The hook runs on the server and in the browser alike, so it must return the same list for the same input, or the
 * page will not hydrate. It runs after `druxt.classes`, so with `false` it receives an empty list.
 *
 * @param hook - Takes Druxt's classes for an element and what they are for, and returns the classes to output.
 *
 * @example <caption>plugins/druxt-classes.ts</caption> @lang ts
 * export default defineNuxtPlugin(() => {
 *   defineDruxtClasses((classes, ctx) => ctx.element === 'label' ? [...classes, 'font-semibold'] : classes)
 * })
 */
export const defineDruxtClasses = (hook: DruxtClassHook): void => {
  const nuxtApp = useNuxtApp()
  const list = hooks.get(nuxtApp) || []
  hooks.set(nuxtApp, [...list, hook])
}

/**
 * The function a Druxt component gets its classes from: `druxt.classes`, then the hooks `defineDruxtClasses()`
 * registered. Call it in `setup()`, and call the function it returns at render.
 *
 * @returns A function from what a class list is for to the classes to output.
 *
 * @example @lang ts
 * const classes = useDruxtClasses()
 * return () => h('ul', { class: classes({ element: 'items', field: 'field_tags' }) })
 */
export const useDruxtClasses = (): (ctx: DruxtClassContext) => string[] => {
  const nuxtApp = useNuxtApp()
  const settings = useDruxtSettings()
  return (ctx) => resolveDruxtClasses(settings.classes as DruxtClassPolicy | undefined, ctx, composeDruxtClassHooks(hooks.get(nuxtApp) || []))
}

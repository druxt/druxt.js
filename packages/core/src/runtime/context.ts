import { inject } from 'vue'
import type { Component, ComputedRef, InjectionKey, Ref, VNode } from 'vue'
import type { DruxtClient } from '@druxt/client'
import type { useDruxtStore } from './store'

/** What a module provides to its subtree, and hands its contract's hooks. */
export interface DruxtModuleContext {
  /** The module's component name, such as DruxtEntity. */
  name: string
  /** The `langcode` prop, or the route's langcode. */
  lang: ComputedRef<string | undefined>
  /** The module's v-model, from Vue's `useModel()`: the parent's value when it binds v-model, else a local one. Writing it emits `update:modelValue`. */
  model: Ref<unknown>
  /**
   * The Druxt client, read when the module was set up. A hook that awaits runs outside the Nuxt context, where
   * `useDruxtClient()` and other composables throw, so a hook uses this.
   *
   * @example @lang ts
   * async fetchData(ctx) {
   *   await something()
   *   items.value = (await ctx.client.getCollection('node--recipe', {}, ctx.lang.value)).data
   * }
   */
  client: DruxtClient
  /** The Druxt store, `useDruxtStore()`, read when the module was set up, for the same reason. */
  store: ReturnType<typeof useDruxtStore>
  /**
   * What the module hands its wrapper: the language, the contract's
   * `propsData`, and the model. A wrapper receives the props it declares.
   *
   * @example @lang js
   * { langcode: 'en', path: '/node/1', route: { label: 'Home' }, modelValue: { label: 'Home' } }
   */
  propsData: ComputedRef<Record<string, unknown>>
  /** The attributes set on the module. */
  attrs: Record<string, unknown>
  /**
   * The wrapper the module resolved, such as `DruxtMenuMain`, or `DruxtWrapper` when no wrapper of the site's or a
   * module's matched. Undefined until the pipeline resolves.
   */
  wrapper: ComputedRef<string | undefined>
  /**
   * The component the module resolved for `wrapper`, as it is registered: the site's when the site registers one under
   * that name. Undefined until the pipeline resolves, and for `DruxtWrapper`.
   */
  wrapperComponent: ComputedRef<Component | undefined>
  /** Runs the module's pipeline again. */
  refresh: () => Promise<void>
  /** In development, the tool that creates this module's missing wrapper; null otherwise. */
  develTemplate: () => VNode | null
}

/** The module context's injection key; `Symbol.for`, so @druxt/compat's DruxtModule can provide it too. */
export const DRUXT_MODULE: InjectionKey<DruxtModuleContext> = Symbol.for('druxt.module')

/** The nearest module's context, or undefined outside a module. */
export const useDruxtModuleContext = (): DruxtModuleContext | undefined => inject(DRUXT_MODULE, undefined)

/**
 * Provided as `true`, the module below fails quietly: a failed pipeline renders nothing in place of DruxtDebug, and
 * in development lists its error in the development tools. It applies to the nearest module only, which provides `false` to
 * its own subtree.
 *
 * @example @lang ts
 * provide(DRUXT_QUIET, true)
 */
export const DRUXT_QUIET: InjectionKey<boolean> = Symbol.for('druxt.quiet')

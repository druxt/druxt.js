import { camelize, cloneVNode, computed, createCommentVNode, createTextVNode, Fragment, getCurrentInstance, h, inject, isVNode, onBeforeUnmount, onMounted, onServerPrefetch, provide, renderSlot, resolveDynamicComponent, shallowRef, toRaw, useAttrs, useId, useModel, watch } from 'vue'
import type { Component, ComponentInternalInstance, Ref, Slot, VNode } from 'vue'
import { createError, isNuxtError, useAsyncData, useNuxtApp, useRoute } from '#imports'
import type { DruxtComponentOptionSets, DruxtModuleSettings, DruxtSlot, DruxtSlots, DruxtTemplateConfig } from './types'
import { getModuleComponents } from './candidates'
import { DRUXT_MODULE, DRUXT_QUIET } from './context'
import type { DruxtModuleContext } from './context'
import { moduleKey } from './utils/key'
import { druxtDevtools, removeModule, reportModule } from './devel/utils/channel'
import { registerMissing, registerNote, unregisterMissing, unregisterNote } from './devel/registry'
import { moduleContexts, moduleInstances, moduleTemplates, schemaId, summarise } from './devel/utils/devtools'
import type { DruxtModuleProps, WrapperOption } from './props'
import { serializable } from './utils/serializable'
import { useDruxtClient } from './composables'
import { useDruxtStore } from './store'
import { declaresEmit, declaresRootless, pickProps, propsObject, readWrapper } from './utils/wrapper'

/**
 * A module's contract: 1.x's hooks, given the module context instead of `this`.
 *
 * The hooks run outside the Nuxt context once they await. A composable such as `useDruxtClient()` or `useNuxtApp()`
 * throws there. Read what a hook needs from `ctx`:
 *
 * - The client is `ctx.client`.
 * - The store is `ctx.store`.
 * - The JSON:API language prefix is `ctx.lang`.
 *
 * Read anything else in `setup()`, before calling `useDruxtModule()`.
 */
export interface DruxtModuleContract {
  /** Loads what the wrapper candidates are named from, before a wrapper is chosen. */
  fetchConfig?: (ctx: DruxtModuleContext) => unknown
  /** The naming parts of the wrapper candidates, as option sets, most specific first. */
  componentOptions?: (ctx: DruxtModuleContext) => DruxtComponentOptionSets
  /**
   * The module's settings, from the chosen wrapper's `druxt` settings.
   *
   * Without this hook, the wrapper's settings are used as they are.
   */
  settings?: (ctx: DruxtModuleContext, wrapperSettings: Record<string, unknown>) => DruxtModuleSettings
  /** Loads the module's data, once the wrapper and its settings are known. */
  fetchData?: (ctx: DruxtModuleContext, settings: DruxtModuleSettings) => unknown
  /** What the module hands its wrapper, besides the language and the model. */
  propsData?: (ctx: DruxtModuleContext) => Record<string, unknown>
  /** The scoped slots the module renders its wrapper with. */
  slots?: (ctx: DruxtModuleContext) => DruxtSlots
  /**
   * Attributes for the wrapper's root, such as DruxtEntity's classes.
   *
   * Where they go:
   *
   * - A wrapper with one root element receives them as fallthrough attributes.
   * - A wrapper with several roots sets `inheritAttrs: false` and binds `$attrs.class` where it wants them.
   * - DruxtWrapper puts them on its element when it has content.
   * - A template in the module's default slot receives none, as it renders in place of a wrapper.
   *
   * DruxtWrapper joins their classes to the site's, each class once. An `id` or a `style` is not joined: the site's
   * replaces the module's whole. One set on the module wins over one set on DruxtWrapper, which wins over this
   * hook's.
   *
   * A module with this hook keeps its root around content even when the hook returns no attributes. So its structure
   * never depends on a setting such as the class policy.
   */
  wrapperAttrs?: (ctx: DruxtModuleContext) => Record<string, unknown>
  /**
   * Whether the module has nothing to render, such as a menu with no links or a breadcrumb with no trail.
   *
   * It is read at render, so it follows the refs it reads.
   *
   * While it answers `true`, the module renders nothing at all. There is no wrapper and no root element, even for a
   * class, an `id` or a `wrapper` option the site set. A default slot the site passes still renders, with the
   * module's props, because its author decides what an empty state shows.
   *
   * Decide it from the module's data, never from what a wrapper renders.
   *
   * @example @lang js
   * empty: () => !items.value.length
   */
  empty?: (ctx: DruxtModuleContext) => boolean
  /**
   * The element DruxtWrapper renders as the module's root, around content. `div` when not set.
   *
   * It applies when the module has `wrapperAttrs` and no site wrapper. DruxtEntityForm's is `form`. A site wrapper
   * renders its own root.
   */
  wrapperTag?: string
  /** What a wrapper created by the development template tool starts with. */
  template?: DruxtTemplateConfig
  /**
   * Refs that must survive hydration. They are sent in the payload and restored in the browser.
   *
   * They hold plain data only, because the payload serializer rejects class instances.
   *
   * They hold references into the stores, such as a store key. They never hold values that depend on the page's
   * route. Under shared prerender data, a server that reads again does not rewrite the shared entry.
   */
  state?: Record<string, Ref<unknown>>
  /**
   * Runs after `state` is restored from a payload this instance did not produce.
   *
   * Such a payload is the server's, through hydration, or another instance's that shares the data. The hook sets
   * what the skipped hooks would have set, such as the model. It runs during setup, so the first render has it.
   *
   * It answers `false` when the stores lack what the state refers to, such as a menu's links. Only `false` counts.
   * This happens under Nuxt's shared prerender data: another prerendered page can hand over its entry while this
   * page's stores start empty.
   *
   * The module then runs its pipeline again, as for a miss. It does so before a server render, and at once in the
   * browser. It does so once per instance and key. It never does so on a result that an instance in the same app
   * produced. So a read that leaves the stores lacking, such as a failed lookup, is not repeated.
   *
   * @example @lang js
   * restore: () => !!stored.value
   */
  restore?: (ctx: DruxtModuleContext) => unknown
  /**
   * Inputs that run the pipeline again when they change. The language always does.
   *
   * They are compared by their JSON, so each value must be JSON-serializable: ids, uuids, strings, numbers, plain
   * objects.
   *
   * They also form the data key, and the key follows them. Two instances with the same inputs share one entry when
   * both resolve a wrapper, or both do not. Prerendered pages never share another page's entry.
   */
  watch?: () => unknown[]
  /**
   * A key in place of `<ModuleName>:<inputs>`.
   *
   * The language, and whether the instance resolves a wrapper, are appended either way. The key is read again when
   * the inputs change, so it should follow them.
   */
  key?: () => string
}

/**
 * What the pipeline resolves, and what the server sends the browser.
 *
 * @example @lang js
 * {
 *   is: 'DruxtRouterEntityFront',
 *   options: ['DruxtRouterEntityFront', 'DruxtRouterEntity', 'DruxtRouterDefault'],
 *   settings: {},
 *   wrapperProps: ['route'],
 *   listens: false,
 *   state: { route: { label: 'Home' } },
 * }
 */
export interface DruxtModulePayload {
  /** The name of the wrapper component the module renders. `DruxtWrapper` when no candidate is registered. */
  is: string
  /** The names of the wrapper candidates, most specific first. */
  options: string[]
  /** The module's settings, as plain data. */
  settings: DruxtModuleSettings
  /** The names of the props the wrapper declares. The module hands it only those. */
  wrapperProps: string[]
  /** Whether the wrapper declares the `update:modelValue` event. */
  listens: boolean
  /** Whether the wrapper has no root element of its own, so the module renders its element around it. */
  rootless?: boolean
  /** The contract's `state` refs, as plain data. */
  state: Record<string, unknown>
}

/**
 * A failed request as an error the payload can carry.
 *
 * It has the status, Drupal's error title, and the request URL.
 *
 * @param err - The error.
 */
const toError = (err: unknown) => {
  // A module can throw its own `createError()`. It is passed through untouched. Reshaping it into a generic 500
  // would drop its `statusCode`, its `data` and its `fatal` flag.
  if (isNuxtError(err) || typeof (err as { statusCode?: unknown } | undefined)?.statusCode === 'number') return err
  const failure = err as { message?: string, druxt?: { url?: string }, response?: { status?: number, statusText?: string, data?: { errors?: { title?: string }[] } } } | undefined
  const response = failure?.response || {}
  const title = response.statusText || response.data?.errors?.[0]?.title
  return createError({
    statusCode: response.status || 500,
    message: response.status ? [response.status, title].filter(Boolean).join(': ') : failure?.message || 'The Druxt module failed.',
    data: { url: failure?.druxt?.url, errors: response.data?.errors },
  })
}

/**
 * A failure's message as the development tools show it.
 *
 * It is the message's first paragraph, without the client's `URL:` line, any URL within a line, or Drupal's detail.
 *
 * @param message - The error's message.
 */
const noteSummary = (message: string): string =>
  message.split(/\n\s*\n/)[0]!.split('\n').filter((line) => !/^URL:/i.test(line.trim())).join(' ')
    .replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim() || 'The Druxt module failed.'

/**
 * One child of a slot's output as a vnode, normalized as Vue normalizes the slots a component receives.
 *
 * @param child - The child.
 */
const slotChild = (child: unknown): VNode => {
  if (child === null || child === undefined || typeof child === 'boolean') return createCommentVNode()
  if (Array.isArray(child)) return h(Fragment, null, child.slice())
  if (isVNode(child)) return child.el === null ? child : cloneVNode(child)
  return createTextVNode(String(child))
}

/**
 * A module's slot as a component would receive it.
 *
 * Its output is always an array of vnodes. So `renderSlot()` renders it as DruxtWrapper renders its own default
 * slot.
 *
 * @param slot - The module's slot.
 */
const asSlot = (slot: DruxtSlot): Slot => (props?: Record<string, unknown>) => {
  const output = slot(props)
  return Array.isArray(output) ? output.map(slotChild) : [slotChild(output)]
}

/**
 * The results any module's pipeline has produced, per app.
 *
 * A restore that misses on one of them is not read again. An instance sharing the key read it just now, and reading
 * again would answer another instance's miss without end.
 *
 * - It is kept per app. A later prerendered page has an app of its own, so it still reads again on an earlier
 *   page's shared entry.
 * - It is kept per client cache generation. After a cache clear, as a login or a logout makes, an instance reads
 *   again once.
 */
const producedByApp = new WeakMap<object, { generation: number, results: WeakSet<DruxtModulePayload> }>()

/** What a module's name is read from: the component's `name`, or else the name `<script setup>` gets from its file. */
interface ModuleType {
  name?: string
  __name?: string
  __file?: string
}

// The components already warned about for having no name, so each is reported once.
const unnamed = new WeakSet<object>()

/** The name a module's wrappers are built from when its component has none. */
const UNNAMED = 'DruxtUnnamed'

/**
 * Gets a module's name.
 *
 * It is the component's `name`, or else `__name`, which the `<script setup>` compiler sets from the file name. An
 * empty name is never valid. A module with neither is named `DruxtUnnamed`, and reported once in development.
 *
 * @param type - The module's component.
 */
const moduleName = (type: ModuleType): string => {
  const name = type.name || type.__name
  if (name) return name
  if (import.meta.dev && !unnamed.has(type)) {
    unnamed.add(type)
    const file = type.__file ? ` (${type.__file})` : ''
    console.error(`[druxt] A module needs a \`name\`${file}: its wrapper names are built from it. Set \`name\` in defineComponent(), or defineOptions({ name }) in <script setup>.`)
  }
  return UNNAMED
}

// The components already warned about for a file name that differs from their registered name.
const misnamed = new WeakSet<object>()

/**
 * The names a module's component is registered under, in its parent's `components` or the app's.
 *
 * Nuxt registers a global component lazily. The app then holds an async wrapper, which points at the component once
 * it has loaded.
 *
 * @param instance - The module's instance.
 */
const registeredNames = (instance: ComponentInternalInstance): string[] => {
  const type = instance.type
  const registries = [(instance.parent?.type as { components?: Record<string, unknown> } | undefined)?.components, instance.appContext.components]
  return registries.flatMap((registry) => Object.entries(registry || {})
    .filter(([, component]) => component === type || (component as { __asyncResolved?: unknown } | undefined)?.__asyncResolved === type)
    .map(([key]) => key))
}

/**
 * Warns once, in development, when a `<script setup>` module's name came from its file and the component is
 * registered under another name.
 *
 * Nuxt prefixes a component in a subdirectory with the directory. So `components/druxt/Recipes.vue` is registered as
 * `DruxtRecipes`, while the file gives the name `Recipes`, and no wrapper would match.
 *
 * @param instance - The module's instance.
 * @param name - The name the module uses.
 */
const warnMisnamed = (instance: ComponentInternalInstance, name: string): void => {
  const type = instance.type as ModuleType
  if (type.name || type.__name !== name || misnamed.has(type)) return
  const names = registeredNames(instance)
  if (!names.length || names.includes(name)) return
  misnamed.add(type)
  const registered = names.find((key) => !key.startsWith('Lazy')) || names[0]
  console.warn(`[druxt] ${registered} takes its module name, ${name}, from its file, so its wrapper candidates start with ${name}, not ${registered}. Set defineOptions({ name: '${registered}' }).`)
}

/**
 * Makes the calling component a Druxt module.
 *
 * It does four things:
 *
 * - Runs the contract's pipeline through `useAsyncData`.
 * - Resolves the wrapper component by name.
 * - Provides the module context.
 * - Returns the module's render function.
 *
 * The module's wrapper candidates are built from its name. The name is the component's `name`. In `<script setup>`
 * it is the name the compiler gives it from the file, or the one `defineOptions({ name })` sets.
 *
 * A module in `defineComponent()` returns the render function from `setup()`. A module in `<script setup>` renders
 * it as a component in its template.
 *
 * A wrapper is an ordinary component, which a module resolves and hands its data. `<script setup>` suits it.
 *
 * @param props - The module's props, including `druxtModuleProps`.
 * @param contract - The module's hooks.
 * @returns The render function, which is also a functional component.
 * @throws When it is called outside `setup()`.
 *
 * @example @lang ts
 * export default defineComponent({
 *   name: 'DruxtMenu',
 *   props: { ...druxtModuleProps, name: String },
 *   emits: druxtModuleEmits,
 *   setup: (props) => useDruxtModule(props, {
 *     componentOptions: () => [[props.name]],
 *   }),
 * })
 *
 * @example <caption>A module in `<script setup>`, in DruxtMenu.vue</caption> @lang vue
 * <script setup lang="ts">
 * const props = defineProps({ ...druxtModuleProps, name: String })
 * defineEmits(druxtModuleEmits)
 * const Module = useDruxtModule(props, {
 *   componentOptions: () => [[props.name]],
 * })
 * </script>
 *
 * <template>
 *   <Module />
 * </template>
 */
export function useDruxtModule(props: DruxtModuleProps, contract: DruxtModuleContract): () => VNode {
  const instance = getCurrentInstance()
  if (!instance) throw new Error('[druxt] useDruxtModule() must be called in setup().')
  const name = moduleName(instance.type as ModuleType)
  if (import.meta.dev) warnMisnamed(instance, name)

  const route = useRoute()
  const lang = computed(() => props.langcode || (route.meta.langcode as string | undefined))

  // Vue's model. It is the parent's value when the parent binds `v-model`, or else a local value. Writing it emits
  // `update:modelValue`.
  const vueModel = useModel(props, 'modelValue') as Ref<unknown>
  // What the module last wrote, held until a bound parent's value arrives.
  //
  // A bound model only emits, and a parent never re-renders during a server render. Without this, a parent bound to
  // an empty ref would render the wrapper without the model on the server, and with it in the browser.
  const pending = shallowRef<unknown>()
  watch(() => props.modelValue, (value) => { if (value !== undefined) pending.value = undefined })
  const model = computed<unknown>({
    get: () => (vueModel.value !== undefined ? vueModel.value : pending.value),
    set: (value) => {
      // The write is held only while the parent's value is empty. A parent with a value that ignores the write keeps
      // its own value. A write held then would outlive it, and answer for a later, deliberate empty value.
      if (props.modelValue === undefined) pending.value = value
      vueModel.value = value
    },
  })

  let refresh = (): Promise<void> => Promise.resolve()
  // The results this instance's own pipeline has produced. The restore watcher below uses it to tell them apart
  // from a result that hydration delivers.
  //
  // It is a WeakSet, not a single slot, for two reasons:
  //
  // - A site that sets `useAsyncData.deep: true` wraps `data` in a reactive proxy. So results are compared raw, with
  //   `toRaw` below.
  // - A superseded run under `dedupe: 'cancel'` must not erase an earlier run that is still pending.
  const produced = new WeakSet<DruxtModulePayload>()
  const nuxtApp = useNuxtApp()
  const druxtClient = useDruxtClient()
  /** The results this app produced since the client's caches were last cleared. */
  const producedHere = (): WeakSet<DruxtModulePayload> => {
    const generation = druxtClient.cacheGeneration || 0
    let held = producedByApp.get(nuxtApp)
    if (!held || held.generation !== generation) {
      held = { generation, results: new WeakSet() }
      producedByApp.set(nuxtApp, held)
    }
    return held.results
  }

  const ctx: DruxtModuleContext = {
    name,
    lang,
    model,
    client: useDruxtClient(),
    store: useDruxtStore(),
    propsData: computed(() => ({ langcode: lang.value, ...contract.propsData?.(ctx), modelValue: model.value })),
    attrs: useAttrs(),
    refresh: () => refresh(),
    wrapper: computed(() => resolved.value?.is),
    wrapperComponent: computed(() => {
      const is = resolved.value?.is
      return is && is !== 'DruxtWrapper' ? registered(is) : undefined
    }),
    develTemplate: () => {
      const payload = resolved.value
      if (!import.meta.dev || !payload || payload.is !== 'DruxtWrapper' || !payload.options.length) return null
      return h(resolveDynamicComponent('DruxtDevelTemplate') as Component, {
        component: name,
        options: payload.options,
        props: Object.keys(ctx.propsData.value),
        slots: Object.keys(contract.slots?.(ctx) || {}),
        template: contract.template || {},
      })
    },
  }
  provide(DRUXT_MODULE, ctx)
  // Whether a failure renders nothing in place of DruxtDebug. It applies to this module only: its own subtree is
  // not quiet.
  const quiet = inject(DRUXT_QUIET, false)
  provide(DRUXT_QUIET, false)

  // A component by its registered name, from the module's own `components` or the app's.
  const registered = (component: string): Component | undefined =>
    (instance.type as { components?: Record<string, Component> }).components?.[component] || instance.appContext.components[component]

  // Whether this instance resolves a wrapper. The slot is read once, as the slots keep their identity. The `wrapper`
  // prop can change, so it is read each time. The payload follows the answer, so the key carries it.
  const template = !!instance.slots.default
  const wantsWrapper = computed(() => (!template && props.wrapper !== false) || (template && !!props.wrapper))
  const variant = (): string => wantsWrapper.value ? 'wrapper' : 'bare'

  // The pipeline: load the config, choose the wrapper, read its settings, load the data, and build the payload.
  const pipeline = async (): Promise<DruxtModulePayload> => {
    try {
      await contract.fetchConfig?.(ctx)
    } catch (err) {
      throw toError(err)
    }

    const candidates = wantsWrapper.value ? getModuleComponents(name, contract.componentOptions?.(ctx) || [], lang.value, (c) => !!registered(c)) : []
    const is = candidates.find((c) => c.global)?.name || 'DruxtWrapper'
    const wrapper = await readWrapper(registered(is))
    const settings = contract.settings ? contract.settings(ctx, wrapper.druxt) : wrapper.druxt as DruxtModuleSettings

    try {
      await contract.fetchData?.(ctx, settings)
    } catch (err) {
      throw toError(err)
    }

    const result: DruxtModulePayload = {
      is,
      options: candidates.map((c) => c.name),
      settings: serializable(settings) as DruxtModuleSettings,
      wrapperProps: Object.keys(wrapper.props),
      listens: declaresEmit(wrapper.component, 'update:modelValue'),
      ...(declaresRootless(wrapper.component) ? { rootless: true } : {}),
      state: Object.fromEntries(Object.entries(contract.state || {}).map(([key, state]) => [key, serializable(toRaw(state.value))])),
    }
    produced.add(result)
    producedHere().add(result)
    return result
  }

  // The key names the data: the module, its language, its inputs and its variant.
  //
  // - A position-based id would be the same on every prerendered page, and Nuxt shares prerendered data by key.
  // - The key is a getter, so a run after an input changes writes under the new inputs' key, not the first run's.
  // - The fallback has the path in it, which keeps it apart across pages.
  // - `useId()` must be read here in setup, never inside the getter.
  const fallback = `druxt:${name}:${route.path}:${useId()}`
  // The watch source is a getter that joins the inputs into one string, so it compares by content. The array
  // `contract.watch()` builds is new on each run, and Vue compares watch sources by reference. Watching it directly
  // would run the pipeline again on every unrelated change too.
  const dataKey = (): string => moduleKey(name, lang.value, variant(), contract.key, contract.watch) ?? fallback
  const asyncData = useAsyncData(dataKey, pipeline, { dedupe: 'defer', watch: [lang, wantsWrapper, ...(contract.watch ? [() => JSON.stringify(contract.watch!())] : [])] })
  // The initial run defers, so instances that share a key share a fetch. An explicit refresh cancels, so a cache
  // clear always starts a new run.
  refresh = () => asyncData.refresh({ dedupe: 'cancel' })

  // The render reads straight from the async data. During SSR, an immediate watcher runs once at setup and never
  // again. A separate ref set by such a watcher would stay null through the render that follows.
  const resolved = computed<DruxtModulePayload | null>(() => asyncData.data.value ?? null)

  // Declared state is restored from a payload this instance's own pipeline did not produce. That payload is the
  // server's, through hydration, or another instance's with the same key.
  //
  // - Its own results are skipped. The refs the pipeline already holds stay live, and are not replaced with a
  //   function-stripped copy after every run.
  // - `toRaw` unwraps the reactive proxy that `deep: true` would otherwise wrap the payload in.
  // - The last payload seen is kept, its own included. So the watcher and the server's call below never restore the
  //   same payload twice. A payload the instance returns to after its own run is restored again.
  let seen: DruxtModulePayload | undefined
  // Whether the last restore found the stores missing what the state refers to. The pipeline must then run again.
  let missed = false
  // The key this instance last read again for. It reads again once per instance per key. So a read that leaves the
  // stores lacking, such as a lookup that fails, is not repeated. A change of inputs or language changes the key.
  let missedKey: string | undefined
  // Runs the pipeline for a miss, past Nuxt's cache. A refresh during hydration, or a refresh of shared prerender
  // data, would answer with the very entry that missed.
  //
  // The run carries its key. A read that ends after the inputs or the language moved on is dropped, and the state
  // its hooks set is put back from the current entry.
  const rerun = async (): Promise<void> => {
    missed = false
    const key = dataKey()
    const stale = () => {
      const current = asyncData.data.value ? toRaw(asyncData.data.value) : undefined
      for (const [stateKey, state] of Object.entries(contract.state || {})) {
        if (current && stateKey in current.state) state.value = current.state[stateKey]
      }
    }
    try {
      const result = await pipeline()
      if (dataKey() !== key) return stale()
      asyncData.data.value = result
    } catch (err) {
      if (dataKey() !== key) return stale()
      asyncData.error.value = err as typeof asyncData.error.value
    }
  }
  // Restores the state from a payload, once per payload, and notes whether the restore missed.
  const apply = (payload: DruxtModulePayload | null | undefined) => {
    const raw = payload ? toRaw(payload) : undefined
    if (!raw || raw === seen) return
    seen = raw
    if (produced.has(raw)) return
    for (const [stateKey, state] of Object.entries(contract.state || {})) {
      if (stateKey in raw.state) state.value = raw.state[stateKey]
    }
    const key = dataKey()
    missed = contract.restore?.(ctx) === false && !producedHere().has(raw) && missedKey !== key
    if (missed) missedKey = key
    if (import.meta.dev && import.meta.client) druxtDevtools()?.emit({ type: 'module:restored', id: String(instance.uid), component: name, key: dataKey() })
  }
  // The development tools know this module before any restore. A note that a contract's `restore()` adds then
  // attaches to this module.
  if (import.meta.dev && import.meta.client) {
    moduleInstances().set(String(instance.uid), instance)
    moduleContexts().set(ctx, String(instance.uid))
  }
  watch(() => asyncData.data.value, (payload) => {
    apply(payload)
    // A miss in the browser is read again, once. The server reads again before it renders, below.
    if (missed && import.meta.client) void rerun()
  }, { immediate: true })
  // A server render never runs a watcher after setup. An instance whose key another instance fetched would then
  // render empty. So the data is applied once it resolves, before this instance renders. The pipeline runs again
  // when the stores lack what the data names.
  if (import.meta.server) {
    onServerPrefetch(async () => {
      await asyncData
      apply(asyncData.data.value)
      if (missed) await rerun()
    })
  }

  // The development tools list every module, and the modules that rendered no wrapper. Nothing inline lists them.
  if (import.meta.dev && import.meta.client) {
    const id = String(instance.uid)
    watch([resolved, () => asyncData.error.value], ([payload, error]) => {
      const candidates = payload?.options || []
      const missing = !!payload && payload.is === 'DruxtWrapper' && candidates.length > 0
      const props = Object.keys(ctx.propsData.value)
      const slots = Object.keys(contract.slots?.(ctx) || {})
      if (missing) registerMissing({ uid: instance.uid, component: name, options: candidates, props, slots, template: contract.template || {} })
      else unregisterMissing(instance.uid)
      if (!payload && !error) return
      reportModule({
        id,
        component: name,
        candidates,
        wrapper: payload && payload.is !== 'DruxtWrapper' ? payload.is : null,
        key: dataKey(),
        status: error ? 'error' : missing ? 'default' : 'ready',
        ...(error ? { statusCode: error.statusCode, error: noteSummary(error.message) } : {}),
        quiet,
        props: summarise(ctx.propsData.value),
        state: summarise(payload?.state),
        settings: summarise(payload?.settings),
        schema: schemaId(payload?.state),
        notes: [],
        ...(missing ? { templates: moduleTemplates({ component: name, candidates, props, slots, template: contract.template || {} }) } : {}),
      })
    }, { immediate: true })
    onBeforeUnmount(() => {
      unregisterMissing(instance.uid)
      moduleInstances().delete(id)
      removeModule(id)
    })
    // A quiet module's failure goes to the development tools, as nothing inline shows it.
    if (quiet) {
      watch(() => asyncData.error.value, (error) => {
        if (!error) return unregisterNote(instance.uid)
        // This whole block is development only. The full message, which may name the backend URL, goes to the
        // console once. The note keeps its first line, without a URL.
        console.warn(`[druxt] ${name} failed quietly:`, error.message)
        registerNote({ uid: instance.uid, component: name, summary: noteSummary(error.message) })
      }, { immediate: true })
      onBeforeUnmount(() => unregisterNote(instance.uid))
    }
  }

  // Renders DruxtDebug.
  const debug = (data: Record<string, unknown>, slots?: Record<string, () => unknown>): VNode =>
    h(resolveDynamicComponent('DruxtDebug') as Component, data, slots)

  // The slots the wrapper is rendered with. A missing required prop renders a debug message in their place.
  //
  // A prop is missing when it was not given, or was given as null or undefined. A falsy value, such as 0, false or
  // an empty string, is a value. Vue reads a boolean prop that was not given as false, so what was given is checked.
  const renderSlots = (): DruxtSlots => {
    const given = new Set(Object.keys(instance.vnode.props || {}).map(camelize))
    const required = Object.entries(propsObject(instance.type.props))
      .filter(([key, option]) => option.required && (!given.has(key) || (instance.props as Record<string, unknown>)[key] == null))
      .map(([key]) => key)
    if (required.length) return { default: () => debug({ summary: `Missing required props: ${required.join(', ')}.`, visible: true }) }

    const slots: DruxtSlots = { ...contract.slots?.(ctx) }
    const template = instance.slots.default
    if (template) slots.default = (attrs) => template({ ...ctx.propsData.value, ...attrs })
    if (!slots.default && import.meta.dev) {
      slots.default = () => debug({ summary: 'Missing default slot', json: ctx.propsData.value, kind: 'missing' }, { default: () => ctx.develTemplate() })
    }
    return slots
  }

  // Whether the render function ran. A module that never returns it, or never renders it in its template, renders
  // nothing.
  let rendered = false
  if (import.meta.dev && import.meta.client) {
    onMounted(() => {
      if (rendered) return
      console.warn(`[druxt] ${name} never rendered: useDruxtModule() returns its render function. Return it from setup(), or in <script setup>, render it in the template as a component: \`const Module = useDruxtModule(props, contract)\`, then \`<Module />\`.`)
    })
  }

  return (): VNode => {
    rendered = true
    const option: WrapperOption = typeof props.wrapper === 'object' && props.wrapper ? props.wrapper : {}
    const elementProps = Object.fromEntries(Object.entries({ class: option.class, style: option.style, ...option.propsData })
      .filter(([, value]) => value !== undefined))
    // The module has no element of its own unless the `wrapper` prop asks for one.
    const element = !!option.component || Object.keys(elementProps).length > 0
    const tag = option.component ? resolveDynamicComponent(option.component) as Component : 'div'
    const wrap = (child: VNode): VNode => element ? h(tag, elementProps, [child]) : child

    const error = asyncData.error.value
    // Only development shows a failure. A production build renders no markup for one, as DruxtDebug renders none.
    if (error) return quiet || !import.meta.dev ? createCommentVNode('druxt') : wrap(debug({ summary: error.message, json: error.data, visible: true }))

    const payload = resolved.value
    if (!payload) return element ? h(tag, elementProps) : createCommentVNode('druxt')
    // The module has nothing to render: no wrapper and no element, whatever the site bound. A comment root takes no
    // attributes, so a class on the module goes nowhere, and Vue does not warn about it. A site's default slot is
    // the exception: it sees the empty data and renders.
    if (!instance.slots.default && contract.empty?.(ctx)) return createCommentVNode('druxt')

    const ownsWrapper = !(instance.slots.default && !props.wrapper) && props.wrapper !== false
    const is = ownsWrapper ? payload.is : 'DruxtWrapper'
    const delivered = pickProps(ctx.propsData.value, ownsWrapper ? payload.wrapperProps : [])
    // Vue 3 passes undeclared listeners to a root component. So the module listens only when the wrapper declares
    // the event.
    const listeners = ownsWrapper && payload.listens ? { 'onUpdate:modelValue': (value: unknown) => { model.value = value } } : {}
    // The module's own root attributes. DruxtWrapper takes them as a prop, so it can tell them from the site's.
    const rootAttrs = ownsWrapper ? contract.wrapperAttrs?.(ctx) : undefined
    // There is nothing to wrap: no site wrapper, no root of the module's own, and nothing the site set on the
    // module. The default output renders in place, as DruxtWrapper would render it, with no instance of its own.
    if (is === 'DruxtWrapper' && !rootAttrs && !Object.keys(ctx.attrs).length) {
      const slot = renderSlots().default
      return wrap(renderSlot(slot ? { default: asSlot(slot) } : {}, 'default', {}))
    }
    const moduleRoot = rootAttrs ? { moduleAttrs: rootAttrs, ...(contract.wrapperTag ? { moduleTag: contract.wrapperTag } : {}) } : {}
    // A wrapper with no root element of its own, as the bundled block wrappers are. The module's element goes around
    // it, through DruxtWrapper. Its classes and the site's attributes then land on one element, and none is lost.
    if (ownsWrapper && payload.rootless && is !== 'DruxtWrapper') {
      const inner = h(resolveDynamicComponent(is) as Component, { ...delivered, ...listeners }, renderSlots())
      // The site's other attributes, such as a role or aria and data attributes, go on the element too, because the
      // wrapper has no root to take them. DruxtWrapper adds the site's class, id and style itself.
      const site = Object.fromEntries(Object.entries(ctx.attrs).filter(([key]) => !['class', 'id', 'style'].includes(key) && !/^on[A-Z]/.test(key)))
      const rootless = Object.keys(site).length ? { ...moduleRoot, moduleAttrs: { ...rootAttrs, ...site } } : moduleRoot
      return wrap(h(resolveDynamicComponent('DruxtWrapper') as Component, rootless, { default: () => [inner] }))
    }
    const root = rootAttrs ? (is === 'DruxtWrapper' ? moduleRoot : rootAttrs) : {}
    return wrap(h(resolveDynamicComponent(is) as Component, { ...root, ...delivered, ...listeners }, renderSlots()))
  }
}

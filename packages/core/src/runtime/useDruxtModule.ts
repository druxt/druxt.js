import { cloneVNode, computed, createCommentVNode, createTextVNode, Fragment, getCurrentInstance, h, inject, isVNode, onBeforeUnmount, onMounted, onServerPrefetch, provide, renderSlot, resolveDynamicComponent, shallowRef, toRaw, useAttrs, useId, useModel, watch } from 'vue'
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
 * The hooks run outside the Nuxt context once they await, so a composable such
 * as `useDruxtClient()` or `useNuxtApp()` throws there. Read what a hook needs
 * from `ctx`: the client is `ctx.client`, the store `ctx.store`, and the
 * JSON:API language prefix `ctx.lang`. Anything else, read in `setup()`
 * before calling `useDruxtModule()`.
 */
export interface DruxtModuleContract {
  /** Loads what the wrapper candidates are named from, before a wrapper is chosen. */
  fetchConfig?: (ctx: DruxtModuleContext) => unknown
  /** The wrapper candidates' naming parts, as option sets, most specific first. */
  componentOptions?: (ctx: DruxtModuleContext) => DruxtComponentOptionSets
  /** The module's settings, from the chosen wrapper's `druxt` settings. Without it, the wrapper's settings are used as they are. */
  settings?: (ctx: DruxtModuleContext, wrapperSettings: Record<string, unknown>) => DruxtModuleSettings
  /** Loads the module's data, once the wrapper and its settings are known. */
  fetchData?: (ctx: DruxtModuleContext, settings: DruxtModuleSettings) => unknown
  /** What the module hands its wrapper, besides the language and the model. */
  propsData?: (ctx: DruxtModuleContext) => Record<string, unknown>
  /** The scoped slots the module renders its wrapper with. */
  slots?: (ctx: DruxtModuleContext) => DruxtSlots
  /**
   * Attributes for the wrapper's root, such as DruxtEntity's classes. A wrapper with one root element receives them as
   * fallthrough attributes. A wrapper with several roots sets `inheritAttrs: false` and binds `$attrs.class` where it
   * wants them. DruxtWrapper puts them on its element when it has content. It joins their classes to the site's, each
   * once, but an `id` or a `style` the site sets replaces the module's whole: one set on the module wins over one set
   * on DruxtWrapper, which wins over this hook's. A template in the module's default slot receives none, as it renders
   * in place of a wrapper. A module with this hook keeps its root around content even when it returns no attributes,
   * so its structure never depends on a setting such as the class policy.
   */
  wrapperAttrs?: (ctx: DruxtModuleContext) => Record<string, unknown>
  /**
   * Whether the module has nothing to render, such as a menu with no links or a breadcrumb with no trail. Read at
   * render, so it follows the refs it reads. While it answers `true`, the module renders nothing at all: no wrapper,
   * no root element, and none for a class, an `id` or a `wrapper` option the site set. A default slot the site passes
   * still renders, with the module's props, as its author decides what an empty state shows. Decide it from the
   * module's data, never from what a wrapper renders.
   *
   * @example @lang js
   * empty: () => !items.value.length
   */
  empty?: (ctx: DruxtModuleContext) => boolean
  /**
   * The element DruxtWrapper renders as the module's root, around content, when the module has `wrapperAttrs` and no
   * site wrapper: `div` when not set. DruxtEntityForm's is `form`. A site wrapper renders its own root.
   */
  wrapperTag?: string
  /** What a wrapper created by the development template tool starts with. */
  template?: DruxtTemplateConfig
  /**
   * Refs that must survive hydration: sent in the payload, restored in the browser. Plain data only: the payload
   * serializer rejects class instances. They hold references into the stores, such as a store key, never values that
   * depend on the page's route: under shared prerender data, a server's read again does not rewrite the shared entry.
   */
  state?: Record<string, Ref<unknown>>
  /**
   * Runs after `state` is restored from a payload this instance did not produce: the server's, through hydration, or
   * another instance's sharing the data. Sets what the skipped hooks would have set, such as the model. It runs during
   * setup, so the first render has it.
   *
   * It answers `false`, and only `false` counts, when the stores lack what the state refers to, such as a menu's
   * links. Another prerendered page can hand over its entry, under Nuxt's shared prerender data, while this page's
   * stores start empty. The module then runs its pipeline again, as for a miss: before a server render, and at once in
   * the browser. It does so once per instance and key, and never on a result an instance in the same app produced, so a
   * read that leaves the stores lacking, such as a failed lookup, is not repeated.
   *
   * @example @lang js
   * restore: () => !!stored.value
   */
  restore?: (ctx: DruxtModuleContext) => unknown
  /** Inputs that run the pipeline again when they change. The language always does. They are compared by their JSON, so each value must be JSON-serializable (ids, uuids, strings, numbers, plain objects). They also form the data key and the key follows them, so two instances with the same inputs that both resolve a wrapper, or both do not, share one entry, and prerendered pages never share another page's. */
  watch?: () => unknown[]
  /** A key in place of `<ModuleName>:<inputs>`. The language and whether the instance resolves a wrapper are appended either way. It is read again when the inputs change, so it should follow them. */
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
  is: string
  options: string[]
  settings: DruxtModuleSettings
  wrapperProps: string[]
  listens: boolean
  /** Whether the wrapper has no root element of its own, so the module renders its element around it. */
  rootless?: boolean
  state: Record<string, unknown>
}

/**
 * A failed request as an error the payload can carry, with the status,
 * Drupal's error title, and the request URL.
 *
 * @param err - The error.
 */
const toError = (err: unknown) => {
  // A module can throw its own createError(): pass it through untouched
  // rather than reshaping it into a generic 500 that drops its statusCode,
  // data and fatal flag.
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
 * A failure's message as the development tools show it: its first paragraph, without the client's `URL:` line, any URL
 * within a line, or Drupal's detail.
 *
 * @param message - The error's message.
 */
const noteSummary = (message: string): string =>
  message.split(/\n\s*\n/)[0]!.split('\n').filter((line) => !/^URL:/i.test(line.trim())).join(' ')
    .replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim() || 'The Druxt module failed.'

/**
 * One child of a slot's output as a vnode, as Vue normalizes the slots a component receives.
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
 * A module's slot as a component would receive it: its output always an array of vnodes, so `renderSlot()` renders
 * it as DruxtWrapper renders its own default slot.
 *
 * @param slot - The module's slot.
 */
const asSlot = (slot: DruxtSlot): Slot => (props?: Record<string, unknown>) => {
  const output = slot(props)
  return Array.isArray(output) ? output.map(slotChild) : [slotChild(output)]
}

/**
 * The results any module's pipeline has produced, per app. A restore that misses on one of them is not read again: an
 * instance sharing the key read it just now, and reading again would answer another instance's miss without end.
 * Per app, so a later prerendered page, with an app of its own, still reads again on an earlier page's shared entry,
 * and per client cache generation, so after a cache clear, as a login or a logout makes, an instance reads again once.
 */
const producedByApp = new WeakMap<object, { generation: number, results: WeakSet<DruxtModulePayload> }>()

/** What a module's name is read from: the component's `name`, else the name `<script setup>` gets from its file. */
interface ModuleType {
  name?: string
  __name?: string
  __file?: string
}

// The components already warned about, so each is reported once.
const unnamed = new WeakSet<object>()

/** The name a module's wrappers are built from when its component has none. */
const UNNAMED = 'DruxtUnnamed'

/**
 * A module's name: the component's `name`, else `__name`, which the `<script setup>` compiler sets from the file name.
 * An empty name is never valid, so a module with neither is `DruxtUnnamed`, reported once in development.
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

// The components already warned about for a file name that is not their registered name.
const misnamed = new WeakSet<object>()

/**
 * The names a module's component is registered under, in its parent's `components` or the app's. Nuxt registers a
 * global component lazily, so the app holds an async wrapper, which points at the component once it has loaded.
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
 * In development, warns once when a `<script setup>` module's name came from its file and the component is
 * registered under another name. Nuxt prefixes a component in a subdirectory with the directory, so
 * `components/druxt/Recipes.vue` is `DruxtRecipes`, while the file gives `Recipes`, and no wrapper would match.
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
 * Makes the calling component a Druxt module: it runs the contract's pipeline
 * through `useAsyncData`, resolves the wrapper component by name, provides
 * the module context, and returns the module's render function.
 *
 * The module's name, which its wrapper candidates are built from, is the
 * component's `name`, or in `<script setup>` the name the compiler gives it
 * from the file, or the one `defineOptions({ name })` sets. A module in
 * `defineComponent()` returns the render function from `setup()`. A module in
 * `<script setup>` renders it as a component in its template.
 *
 * A wrapper, which a module resolves and hands its data, is an ordinary
 * component, and `<script setup>` suits it.
 *
 * @param props - The module's props, including `druxtModuleProps`.
 * @param contract - The module's hooks.
 * @returns The render function, which is also a functional component.
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

  // Vue's model: the parent's value when it binds v-model, else a local value. Writing it emits update:modelValue.
  const vueModel = useModel(props, 'modelValue') as Ref<unknown>
  // What the module last wrote, until a bound parent's value arrives. A bound model only emits, and a parent never
  // re-renders during a server render, so without it a parent bound to an empty ref renders the wrapper without the
  // model on the server and with it in the browser.
  const pending = shallowRef<unknown>()
  watch(() => props.modelValue, (value) => { if (value !== undefined) pending.value = undefined })
  const model = computed<unknown>({
    get: () => (vueModel.value !== undefined ? vueModel.value : pending.value),
    set: (value) => {
      // Only while the parent's value is empty: a parent with a value that ignores the write keeps its own value, and
      // a held write would outlive it and answer for a later, deliberate empty value.
      if (props.modelValue === undefined) pending.value = value
      vueModel.value = value
    },
  })

  let refresh = (): Promise<void> => Promise.resolve()
  // Results this instance's own pipeline has produced, so the restore watcher
  // below can tell them apart from one hydration delivers. A WeakSet, not a
  // single slot: a site that sets `useAsyncData.deep: true` wraps `data` in
  // a reactive proxy, so compare raw (compared with toRaw below), and a
  // superseded run under `dedupe: 'cancel'` must not erase an earlier one
  // still pending.
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
  // Whether a failure renders nothing in place of DruxtDebug. Only this module's: its own subtree is not quiet.
  const quiet = inject(DRUXT_QUIET, false)
  provide(DRUXT_QUIET, false)

  const registered = (component: string): Component | undefined =>
    (instance.type as { components?: Record<string, Component> }).components?.[component] || instance.appContext.components[component]

  // Whether this instance resolves a wrapper. Read once: the slots keep their identity, and the payload follows it, so the key carries it.
  const template = !!instance.slots.default
  const wantsWrapper = (!template && props.wrapper !== false) || (template && !!props.wrapper)
  const variant = wantsWrapper ? 'wrapper' : 'bare'

  const pipeline = async (): Promise<DruxtModulePayload> => {
    try {
      await contract.fetchConfig?.(ctx)
    } catch (err) {
      throw toError(err)
    }

    const candidates = wantsWrapper ? getModuleComponents(name, contract.componentOptions?.(ctx) || [], lang.value, (c) => !!registered(c)) : []
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

  // The key names the data: the module, its language, its inputs and its
  // variant. A position-based id would be the same on every prerendered page,
  // and Nuxt shares prerendered data by key. A getter, so a run after an input
  // changes writes under the new inputs' key, not the first run's. The path
  // keeps the fallback apart across pages. useId() must be read here in setup,
  // never inside the getter.
  const fallback = `druxt:${name}:${route.path}:${useId()}`
  // A getter, not the array contract.watch() builds fresh each run: Vue compares
  // watch sources by reference, so a new array would re-run the pipeline on
  // every unrelated change too. Joined into one string, it compares by content.
  const dataKey = (): string => moduleKey(name, lang.value, variant, contract.key, contract.watch) ?? fallback
  const asyncData = useAsyncData(dataKey, pipeline, { dedupe: 'defer', watch: [lang, ...(contract.watch ? [() => JSON.stringify(contract.watch!())] : [])] })
  // The initial run defers, so instances sharing a key share a fetch. An explicit refresh cancels, so a cache clear always starts a fresh run.
  refresh = () => asyncData.refresh({ dedupe: 'cancel' })

  // Render straight from the async data: during SSR, an immediate watcher
  // runs once at setup and never again, so a separate ref it set would stay
  // null through the render that follows.
  const resolved = computed<DruxtModulePayload | null>(() => asyncData.data.value ?? null)

  // Restore declared state from a payload this instance's own pipeline did
  // not produce: the server's, through hydration, or another instance's with
  // the same key. Skipping its own results keeps the refs the pipeline already
  // holds live, rather than replacing them with a function-stripped copy after
  // every run. toRaw unwraps the reactive proxy `deep: true` would otherwise
  // wrap the payload in. The last payload seen, its own included, is kept, so
  // the watcher and the server's call below never restore the same payload
  // twice, and a payload it returns to after its own run is restored again.
  let seen: DruxtModulePayload | undefined
  // Whether the last restore found the stores missing what the state refers to, so the pipeline must run again.
  let missed = false
  // The key this instance last read again for: once per instance per key, so a read that leaves the stores lacking,
  // such as a lookup that fails, is not repeated. A change of inputs or language changes the key.
  let missedKey: string | undefined
  // Runs the pipeline for a miss, past Nuxt's cache: a refresh during hydration, or of shared prerender data, answers
  // with the very entry that missed.
  // It carries its key: a read that ends after the inputs or the language moved on is dropped, and the state its hooks
  // set is put back from the current entry.
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
  // Known to the development tools before any restore, so a note a contract's restore() adds attaches to this module.
  if (import.meta.dev && import.meta.client) {
    moduleInstances().set(String(instance.uid), instance)
    moduleContexts().set(ctx, String(instance.uid))
  }
  watch(() => asyncData.data.value, (payload) => {
    apply(payload)
    // A miss in the browser: read again, once. The server reads again before it renders, below.
    if (missed && import.meta.client) void rerun()
  }, { immediate: true })
  // A server render never runs a watcher after setup, so an instance whose key another instance fetched would render
  // empty. Apply the data once it resolves, before this instance renders, and read again when the stores lack what it
  // names.
  if (import.meta.server) {
    onServerPrefetch(async () => {
      await asyncData
      apply(asyncData.data.value)
      if (missed) await rerun()
    })
  }

  // The development tools list every module, and those that rendered no wrapper. Nothing inline does.
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
    // A quiet module's failure goes to the development tools, since nothing inline shows it.
    if (quiet) {
      watch(() => asyncData.error.value, (error) => {
        if (!error) return unregisterNote(instance.uid)
        // Development only, as this whole block is: the full message, which may name the backend URL, goes to the console
        // once. The note keeps its first line, without a URL.
        console.warn(`[druxt] ${name} failed quietly:`, error.message)
        registerNote({ uid: instance.uid, component: name, summary: noteSummary(error.message) })
      }, { immediate: true })
      onBeforeUnmount(() => unregisterNote(instance.uid))
    }
  }

  const debug = (data: Record<string, unknown>, slots?: Record<string, () => unknown>): VNode =>
    h(resolveDynamicComponent('DruxtDebug') as Component, data, slots)

  const renderSlots = (): DruxtSlots => {
    const required = Object.entries(propsObject(instance.type.props))
      .filter(([key, option]) => option.required && !(instance.props as Record<string, unknown>)[key])
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

  // Whether the render function ran: a module that never returns it, or never renders it in its template, renders nothing.
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
    // No element of its own unless the `wrapper` prop asks for one.
    const element = !!option.component || Object.keys(elementProps).length > 0
    const tag = option.component ? resolveDynamicComponent(option.component) as Component : 'div'
    const wrap = (child: VNode): VNode => element ? h(tag, elementProps, [child]) : child

    const error = asyncData.error.value
    // The loud arm is development's: a production build renders no markup for a failure, as DruxtDebug renders none.
    if (error) return quiet || !import.meta.dev ? createCommentVNode('druxt') : wrap(debug({ summary: error.message, json: error.data, visible: true }))

    const payload = resolved.value
    if (!payload) return element ? h(tag, elementProps) : createCommentVNode('druxt')
    // Nothing to render: no wrapper and no element, whatever the site bound. A comment root takes no attributes, so a
    // class on the module goes nowhere, and Vue warns about none. A site's default slot sees the empty data and renders.
    if (!instance.slots.default && contract.empty?.(ctx)) return createCommentVNode('druxt')

    const ownsWrapper = !(instance.slots.default && !props.wrapper) && props.wrapper !== false
    const is = ownsWrapper ? payload.is : 'DruxtWrapper'
    const delivered = pickProps(ctx.propsData.value, ownsWrapper ? payload.wrapperProps : [])
    // Vue 3 passes undeclared listeners to a root component, so listen only when the wrapper declares the event.
    const listeners = ownsWrapper && payload.listens ? { 'onUpdate:modelValue': (value: unknown) => { model.value = value } } : {}
    // The module's own root attributes: DruxtWrapper takes them as a prop, so it can tell them from the site's.
    const rootAttrs = ownsWrapper ? contract.wrapperAttrs?.(ctx) : undefined
    // Nothing to wrap: no site wrapper, no root of the module's own, and nothing the site set on the module. The default
    // output renders in place, as DruxtWrapper would render it, without an instance of its own.
    if (is === 'DruxtWrapper' && !rootAttrs && !Object.keys(ctx.attrs).length) {
      const slot = renderSlots().default
      return wrap(renderSlot(slot ? { default: asSlot(slot) } : {}, 'default', {}))
    }
    const moduleRoot = rootAttrs ? { moduleAttrs: rootAttrs, ...(contract.wrapperTag ? { moduleTag: contract.wrapperTag } : {}) } : {}
    // A wrapper with no root element of its own, as the bundled block wrappers are: the module's element goes around it,
    // through DruxtWrapper, so its classes and the site's attributes land on one element and none falls nowhere.
    if (ownsWrapper && payload.rootless && is !== 'DruxtWrapper') {
      const inner = h(resolveDynamicComponent(is) as Component, { ...delivered, ...listeners }, renderSlots())
      // The site's other attributes, such as a role or aria and data attributes, go on the element too: the wrapper has
      // no root to take them. DruxtWrapper adds the site's class, id and style itself.
      const site = Object.fromEntries(Object.entries(ctx.attrs).filter(([key]) => !['class', 'id', 'style'].includes(key) && !/^on[A-Z]/.test(key)))
      const rootless = Object.keys(site).length ? { ...moduleRoot, moduleAttrs: { ...rootAttrs, ...site } } : moduleRoot
      return wrap(h(resolveDynamicComponent('DruxtWrapper') as Component, rootless, { default: () => [inner] }))
    }
    const root = rootAttrs ? (is === 'DruxtWrapper' ? moduleRoot : rootAttrs) : {}
    return wrap(h(resolveDynamicComponent(is) as Component, { ...root, ...delivered, ...listeners }, renderSlots()))
  }
}

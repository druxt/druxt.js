<template>
  <details v-if="shown" class="druxt-debug not-prose" v-bind="rootAttrs()">
    <summary class="druxt-debug__summary">
      <svg class="druxt-debug__chevron" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4l4 4-4 4" /></svg>
      <span class="druxt-debug__title">{{ label() }}</span>
      <span v-if="meta" class="druxt-debug__meta">{{ meta }}</span>
    </summary>
    <div v-if="$slots.default" class="druxt-debug__body">
      <slot />
    </div>
    <pre v-if="json" class="druxt-debug__json"><code><component :is="jsonView" v-if="jsonView" :value="json" /><template v-else>{{ JSON.stringify(json, null, '  ') }}</template></code></pre>
  </details>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, defineComponent } from 'vue'
import type { ComponentPublicInstance, PropType } from 'vue'
import { isTree, size } from '../devel/utils/size'
import { useDruxtSettings } from '../settings'

// The folding JSON view. It is loaded in development only. A production build has none of it, and prints plain JSON.
const jsonView = import.meta.dev ? defineAsyncComponent(() => import('../devel/utils/json')) : undefined

/**
 * Renders debug details, in development.
 *
 * A production build renders nothing, whatever `visible` says. So no error path shows a visitor a debug panel.
 *
 * Long strings and deep objects in `json` fold to a button that expands them in place.
 *
 * @example @lang vue
 * <DruxtDebug :json="entity">Debug information</DruxtDebug>
 */
export default defineComponent({
  name: 'DruxtDebug',
  // A `title` attribute names the summary, as `summary` does. It does not reach the root, where it would be a
  // tooltip and an accessible name.
  inheritAttrs: false,

  props: {
    /**
     * JSON data to format for readability.
     *
     * @example @lang vue
     * <DruxtDebug :json="{ data: [{ one: true, two: false }] }" />
     */
    json: { type: [Array, Object] as PropType<unknown[] | Record<string, unknown>>, default: undefined },
    /**
     * Text to use for the debug summary.
     *
     * @example @lang vue
     * <DruxtDebug summary="Foo bar" />
     */
    summary: { type: String, default: 'Debug' },
    /** Whether to render in development. A production build renders nothing, whatever this says. */
    visible: { type: Boolean, default: import.meta.dev },
    /**
     * Set to `missing` for a missing-wrapper message. Such a message goes to the development tools, unless the site
     * asks for 1.x's inline messages.
     */
    kind: { type: String as PropType<'missing' | undefined>, default: undefined },
  },

  setup() {
    const settings = useDruxtSettings()
    // The site can ask for 1.x's inline messages. Otherwise messages go to the development tools.
    return { inline: computed(() => settings.develMessages === 'inline'), jsonView }
  },

  /** The module the message is about, and what to show. */
  computed: {
    /**
     * The Druxt module that rendered this message.
     *
     * It is the nearest parent named `Druxt*`, past DruxtWrapper and Nuxt's async component wrappers.
     */
    module(): ComponentPublicInstance | null {
      let parent = this.$parent
      while (parent) {
        const name = parent.$options.name || ''
        if (name.startsWith('Druxt') && name !== 'DruxtWrapper') return parent
        parent = parent.$parent
      }
      return null
    },

    /** The summary, with the module's name before it when there is one: `[DruxtEntity] Missing display settings`. */
    title(): string {
      const name = this.module?.$options.name
      return name ? `[${name}] ${this.summary}` : this.summary
    },

    /** The text shown beside the summary. It is the JSON's size, after its JSON:API type when it has one. */
    meta(): string {
      const json = this.json
      if (!isTree(json)) return ''
      const type = (json as { type?: unknown }).type
      return [typeof type === 'string' ? type : '', size(json)].filter(Boolean).join(' · ')
    },

    /**
     * Whether the message renders.
     *
     * A missing-wrapper message goes to the development tools, unless the site is configured for 1.x's inline
     * messages.
     */
    shown(): boolean {
      // Development only, so a production build renders no markup for it on any path.
      if (!import.meta.dev || !this.visible) return false
      return this.kind !== 'missing' || this.inline
    },
  },

  methods: {
    /**
     * The title, with a `title` attribute as an alias of `summary`.
     *
     * It is a method because attributes are not reactive in a computed.
     */
    label(): string {
      const alias = this.$attrs.title
      if (typeof alias !== 'string') return this.title
      const name = this.module?.$options.name
      return name ? `[${name}] ${alias}` : alias
    },
    /** The attributes for the root, without `title`. */
    rootAttrs(): Record<string, unknown> {
      const { title, ...rest } = this.$attrs
      void title
      return rest
    },
  },
})
</script>

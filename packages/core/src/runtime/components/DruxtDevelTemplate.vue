<template>
  <div v-if="dev && names.length" class="druxt-devel-template" :aria-busy="state === 'busy'">
    <label class="druxt-devel-template__label" :for="id">Create a wrapper</label>
    <div class="druxt-devel-template__row">
      <span class="druxt-devel-template__field">
        <select :id="id" v-model="name" :disabled="state === 'busy'">
          <option v-for="option of names" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
      </span>
      <button type="button" class="druxt-devel-template__create" :disabled="state === 'busy'" @click="create">
        <template v-if="state === 'busy'">
          <svg class="druxt-devel-template__spinner" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8" cy="8" r="5.5" opacity="0.35" /><path d="M8 2.5a5.5 5.5 0 0 1 5.5 5.5" stroke-linecap="round" /></svg>
          Creating
        </template>
        <template v-else>
          Create
        </template>
      </button>
    </div>
    <p v-if="state === 'done'" role="status" class="druxt-devel-template__result druxt-devel-template__result--done">
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
      <span>Created <code>{{ path }}</code>. Hot reload will swap it in.</span>
    </p>
    <template v-else-if="state === 'refused'">
      <div role="alert" class="druxt-devel-template__result druxt-devel-template__result--refused">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6" /><path d="M8 5v3.5M8 11h0" /></svg>
        <span>The file was not created. {{ message }} <span v-if="byHand" class="druxt-devel-template__then">Create the file yourself at <code>{{ path }}</code>.</span></span>
      </div>
      <template v-if="byHand">
        <button type="button" class="druxt-devel-template__copy" @click="copy">
          {{ copyLabel }}
        </button>
        <div v-if="copied === 'manual'" class="druxt-devel-template__preview">
          <div class="druxt-devel-template__path">
            {{ path }}
          </div>
          <pre ref="manual" tabindex="0" :aria-label="`Starter for ${path}, selected to copy`">{{ starter }}</pre>
        </div>
      </template>
    </template>
    <div v-else class="druxt-devel-template__preview">
      <div class="druxt-devel-template__path">
        {{ path }}
      </div>
      <pre tabindex="0" :aria-label="`Starter for ${path}`">{{ starter }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, useId } from 'vue'
import type { PropType } from 'vue'
import { DRUXT_API_BASE } from '@druxt/core/routes'
import { isTemplateName, renderTemplate, templatePath } from '../utils/template'
import type { DruxtTemplateRequest } from '../utils/template'
import type { DruxtTemplateConfig } from '../types'

// Why the dev server refuses a host other than this machine, in words a developer can act on.
const REFUSED_HOST = 'Wrapper files are only written when the dev server runs on localhost.'

/**
 * In development, offers to create a wrapper component for the module that renders it.
 *
 * The developer picks one of the module's candidate names, and sees the file's path and starter. The file is then
 * written to `components/druxt/...` and opened in the editor.
 *
 * DruxtDebug shows this tool inline when no wrapper is found and the site asks for inline messages. The DevTools tab
 * offers the same action. A created file is announced as a status, and a refusal as an alert.
 *
 * It works on this machine only. The endpoint refuses any host but localhost, so it does nothing through a tunnel.
 *
 * @example @lang vue
 * <DruxtDevelTemplate
 *   component="DruxtEntity"
 *   :options="['DruxtEntityNodePageDefaultView', 'DruxtEntityDefault']"
 *   :template="{ debug: '{ entity, schema }', from: '@druxt/entity/runtime', props: 'druxtEntityProps', composable: { name: 'useDruxtEntity', use: ['classes'] } }"
 * />
 */
export default defineComponent({
  name: 'DruxtDevelTemplate',

  /** The module, its wrapper names, and what a wrapper starts with. */
  props: {
    /** The module component, such as `DruxtEntity`. */
    component: { type: String, required: true },
    /** The module's candidate wrapper names, most specific first. */
    options: { type: Array as PropType<string[]>, default: () => [] },
    /** The props the module hands its wrapper. */
    props: { type: Array as PropType<string[]>, default: () => [] },
    /** The module's slot names. */
    slots: { type: Array as PropType<string[]>, default: () => [] },
    /** The module's `druxt.template` settings. */
    template: { type: Object as PropType<DruxtTemplateConfig>, default: () => ({}) },
  },

  setup: () => ({ id: useId() }),

  /**
   * The chosen name and the request's state.
   *
   * @property name - The wrapper name to create.
   * @property state - Idle, busy while a request is in flight, then done or refused.
   * @property message - The dev server's reason for refusing the request.
   * @property byHand - Whether the developer can create the file by hand. Not for a name that exists, or a bad request.
   * @property copied - Whether the path and starter were copied, or are shown selected for copying by hand.
   */
  data() {
    return { name: '', state: 'idle' as 'idle' | 'busy' | 'done' | 'refused', message: '', byHand: false, copied: 'idle' as 'idle' | 'copied' | 'manual' }
  },

  /** The names that can be created. */
  computed: {
    /** Whether this is a development build. */
    dev: () => import.meta.dev,
    /** The candidate names the dev server accepts. */
    names(): string[] {
      return this.options.filter((option) => isTemplateName(this.component, option))
    },
    /** The dev server's request body. */
    request(): DruxtTemplateRequest {
      return { component: this.component, name: this.name, props: this.props, slots: this.slots, template: this.template }
    },
    /** The file's path from the app's root, as the dev server writes it. */
    path(): string {
      return `components/${templatePath(this.request)}`
    },
    /** The copy button's label, for each outcome. */
    copyLabel(): string {
      return { idle: 'Copy path and starter', copied: 'Copied', manual: 'Copy unavailable: select and copy below' }[this.copied]
    },
    /** The file's starter, as the dev server writes it. */
    starter(): string {
      return renderTemplate(this.request)
    },
  },

  watch: {
    // Another name is another file, so the tool goes back to that file's preview.
    name() {
      this.state = 'idle'
      this.copied = 'idle'
    },
  },

  created() {
    this.name = this.names[0] || ''
  },

  /** The create and copy handlers. */
  methods: {
    /** Asks the dev server for the file, then opens it in the editor. */
    async create(): Promise<void> {
      this.state = 'busy'
      this.message = ''
      try {
        const { file } = await $fetch<{ file: string }>(`${DRUXT_API_BASE}/template`, { method: 'POST', body: this.request })
        this.state = 'done'
        // Vite's open-in-editor endpoint. Nothing is lost if there is none.
        await fetch(`/__open-in-editor?file=${encodeURIComponent(file)}`).catch(() => {})
      } catch (error) {
        const { statusCode, statusMessage, message } = error as { statusCode?: number, statusMessage?: string, message?: string }
        this.message = statusCode === 403 && !/origin/i.test(statusMessage || '') ? REFUSED_HOST : statusMessage || message || ''
        // The file can still be made by hand when the request was refused for the host, or was never answered. Not
        // after a 409 or a 400: the name exists, or the request is bad.
        this.byHand = !statusCode || statusCode === 403
        this.copied = 'idle'
        this.state = 'refused'
      }
    },
    /**
     * Copies the path and the starter, for creating the file by hand.
     *
     * The clipboard may be missing or may refuse, as on an origin that is not secure. The starter is then shown
     * selected instead.
     */
    async copy(): Promise<void> {
      try {
        if (!navigator.clipboard) throw new Error('The clipboard is missing on this origin.')
        await navigator.clipboard.writeText(`${this.path}\n\n${this.starter}`)
        this.copied = 'copied'
      } catch {
        this.copied = 'manual'
        await this.$nextTick()
        const pre = this.$refs.manual as HTMLElement | undefined
        if (!pre) return
        pre.focus()
        const range = document.createRange()
        range.selectNodeContents(pre)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(range)
      }
    },
  },
})
</script>

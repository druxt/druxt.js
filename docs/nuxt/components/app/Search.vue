<template>
  <transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh] bg-neutral/50"
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
      ref="dialog"
      @click.self="close"
      @keydown.esc.prevent="close"
      @keydown.tab="onTab"
    >
      <div class="w-full max-w-xl rounded-box bg-base-100 border border-base-300 shadow-2xl overflow-hidden">
        <!--
          `search-row` moves the focus ring onto this whole row rather than
          the bare <input>. The input is only the middle of three flex
          children, so a ring on the input alone drew an inset rectangle that
          excluded the search icon and the esc key — it read as a box inside
          the box. See assets/css/app.css.
        -->
        <div class="search-row flex items-center gap-3 px-4 border-b border-base-300">
          <AppIconSearch class="w-5 h-5 opacity-70 flex-shrink-0" />
          <!--
            Combobox semantics: the arrow-key cursor was visual only, so a
            screen reader had no way to know which result was selected.
            aria-activedescendant points at the highlighted option's id
            while focus stays in the input.
          -->
          <input
            ref="input"
            v-model="query"
            type="text"
            class="flex-1 h-14 bg-transparent outline-none text-base placeholder:text-base-content/70"
            placeholder="Search the guide, modules and API…"
            autocomplete="off"
            spellcheck="false"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            :aria-activedescendant="activeId"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="go(flat[cursor])"
            @keydown.esc.prevent="close"
          >
          <button v-if="query" type="button" class="btn btn-ghost btn-xs" @click="query = ''">Clear</button>
          <!--
            A button, not a bare <kbd>. It sits in the same slot as the Clear
            button above and looks just as clickable, so a mouse user reads it
            as the close control and clicks it, and nothing happened. The
            <kbd> stays as the visible label so it still reads as the keyboard
            hint it also is; the sr-only text supplies the meaning, and keeping
            "esc" inside the accessible name leaves the control addressable by
            voice (WCAG 2.5.3).
          -->
          <button
            v-else
            type="button"
            class="flex-shrink-0 cursor-pointer rounded-btn opacity-70 hover:opacity-100 transition-opacity"
            title="Close search"
            @click="close"
          >
            <span class="sr-only">Close search</span>
            <kbd class="kbd kbd-xs">esc</kbd>
          </button>
        </div>

        <!--
          Results arrive 180ms after typing and were announced nowhere: a
          screen reader user got silence whether the search found 20 matches
          or none (WCAG 4.1.3). Visually hidden because the count is already
          obvious to a sighted user from the list itself.
        -->
        <p class="sr-only" role="status" aria-live="polite">{{ resultsMessage }}</p>

        <!-- Results -->
        <div id="search-results" ref="list" role="listbox" class="max-h-[60vh] overflow-y-auto py-2">
          <template v-if="query && flat.length">
            <div v-for="group of groups" :key="group.type">
              <template v-if="results[group.type].length">
                <p class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-base-content/70">
                  {{ group.label }}
                </p>
                <button
                  v-for="item of results[group.type]"
                  :id="optionId(item)"
                  :key="item.path"
                  type="button"
                  role="option"
                  :aria-selected="isCursor(item) ? 'true' : 'false'"
                  class="w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors"
                  :class="isCursor(item) ? 'bg-base-200' : 'hover:bg-base-200/60'"
                  @mouseenter="focus(item)"
                  @click="go(item)"
                >
                  <component :is="iconFor(group)" class="w-4 h-4 mt-1 flex-shrink-0 opacity-70 stroke-current" />
                  <span class="min-w-0">
                    <span class="block text-sm font-medium truncate">{{ item.title }}</span>
                    <span v-if="item.description" class="block text-xs text-base-content/70 truncate">{{ item.description }}</span>
                    <span class="block text-[11px] text-base-content/70 truncate">{{ item.path }}</span>
                  </span>
                </button>
              </template>
            </div>
          </template>

          <!-- Empty query -->
          <template v-else-if="!query">
            <template v-if="searches.length">
              <p class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-base-content/70">
                Recent searches
              </p>
              <button
                v-for="term of searches"
                :key="term"
                type="button"
                class="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-base-200/60"
                @click="query = term"
              >
                <AppIconSearch class="w-4 h-4 opacity-70 flex-shrink-0" />
                <span class="text-sm truncate">{{ term }}</span>
              </button>
            </template>

            <template v-if="recent.length">
              <p class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-base-content/70">
                Recent documents
              </p>
              <button
                v-for="item of recent"
                :key="item.to"
                type="button"
                class="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-base-200/60"
                @click="go({ path: item.to })"
              >
                <component
                  :is="'app-icon-' + (item.to.slice(1).split('/')[0] || 'guide')"
                  class="w-4 h-4 flex-shrink-0 opacity-70 stroke-current"
                />
                <span class="min-w-0">
                  <span class="block text-sm truncate">{{ item.text }}</span>
                  <!-- Several documents share a title (every module has a
                       "Deprecations" page), so the title alone is ambiguous. -->
                  <span
                    v-if="contextFor(item.to)"
                    class="block text-[11px] text-base-content/70 truncate"
                  >{{ contextFor(item.to) }}</span>
                </span>
              </button>
            </template>

            <p v-if="!searches.length && !recent.length" class="px-4 py-6 text-sm text-base-content/70">
              Search across the tutorials, how-to guides, module documentation and the generated API reference.
            </p>
          </template>

          <!-- No results -->
          <p v-else-if="!loading" class="px-4 py-8 text-center text-sm text-base-content/70">
            No results for “{{ query }}”.
          </p>
        </div>

        <!-- Hints -->
        <div class="flex items-center gap-4 px-4 py-2 border-t border-base-300 text-[11px] text-base-content/70">
          <span><kbd class="kbd kbd-xs">↑</kbd> <kbd class="kbd kbd-xs">↓</kbd> navigate</span>
          <span><kbd class="kbd kbd-xs">↵</kbd> open</span>
          <span><kbd class="kbd kbd-xs">esc</kbd> close</span>
          <span class="flex-1" />
          <span v-if="loading">Searching…</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { documentContext } from '~/utils/content'
import { trapTab } from '~/utils/focus'

const GROUPS = [
  { type: 'tutorials', label: 'Tutorials' },
  { type: 'how-to', label: 'How-to guides' },
  { type: 'modules', label: 'Modules' },
  { type: 'components', label: 'Components' },
  { type: 'api', label: 'API' },
  { type: 'explanation', label: 'Concepts' },
]

const EMPTY = () => ({ tutorials: [], 'how-to': [], modules: [], components: [], api: [], explanation: [] })

export default {
  props: {
    open: { type: Boolean, default: false },
  },

  data: () => ({
    groups: GROUPS,
    query: '',
    cursor: 0,
    loading: false,
    results: EMPTY(),
    /** Element to return focus to when the dialog closes. */
    restoreFocusTo: null,
  }),

  computed: {
    /** Results flattened in display order, for keyboard navigation. */
    flat: ({ groups, results }) => groups.reduce((acc, group) => acc.concat(results[group.type]), []),

    // Excludes the page you are on, matching AppSidebar: offering a link to
    // the document already open wastes one of five rows.
    recent: ({ $store, $route }) => $store.state.recent
      .filter((o) => o.to !== $route.path)
      .slice(0, 5),

    searches: ({ $store }) => $store.state.searches.slice(0, 5),

    /** id of the highlighted option, for aria-activedescendant. */
    activeId() {
      const item = this.flat[this.cursor]
      return item ? this.optionId(item) : null
    },

    /** Announced to assistive technology as results settle. */
    resultsMessage() {
      if (!this.query) return ''
      if (this.loading) return 'Searching…'
      const n = this.flat.length
      if (!n) return `No results for ${this.query}`
      return `${n} result${n === 1 ? '' : 's'} for ${this.query}`
    },
  },

  watch: {
    open(open) {
      // Matches the lightboxes in AppFigure and AppProse, which already lock
      // scroll while they are open; the dialog was the one overlay that let
      // the page scroll behind it.
      document.documentElement.style.overflow = open ? 'hidden' : ''

      if (open) {
        // Restored when the dialog closes, so focus does not fall to <body>
        // on a node that no longer exists.
        this.restoreFocusTo = document.activeElement
        this.$nextTick(() => this.$refs.input && this.$refs.input.focus())
        return
      }
      const target = this.restoreFocusTo
      this.restoreFocusTo = null
      if (target && document.contains(target)) this.$nextTick(() => target.focus())
    },

    query() {
      this.cursor = 0
      clearTimeout(this.debounce)
      if (!this.query) {
        this.results = EMPTY()
        this.loading = false
        return
      }
      this.loading = true
      this.debounce = setTimeout(this.search, 180)
    },
  },

  beforeDestroy() {
    clearTimeout(this.debounce)
    // Don't leave the page unscrollable if the dialog is torn down while open.
    document.documentElement.style.overflow = ''
  },

  methods: {
    async search() {
      const query = this.query
      const results = EMPTY()

      await Promise.all(GROUPS.map(async ({ type }) => {
        try {
          results[type] = await this.$content(type, { deep: true })
            .only(['title', 'description', 'path'])
            .search(query)
            .limit(type === 'api' ? 4 : 6)
            .fetch()
        } catch (e) {
          results[type] = []
        }
      }))

      // Discard a response the user has already typed past.
      if (query !== this.query) return
      this.results = results
      this.loading = false
    },

    /**
     * Keep Tab inside the dialog.
     *
     * It declares `aria-modal="true"`, which tells assistive technology the
     * rest of the page is hidden — so letting focus walk out into content the
     * AT is actively suppressing is worse than not claiming modality at all.
     */
    onTab(e) {
      trapTab(this.$refs.dialog, e)
    },

    /** Where a recent document sits, so same-titled pages are told apart. */
    contextFor(to) {
      return documentContext(to)
    },

    /** Stable per-result DOM id, so aria-activedescendant can point at it. */
    optionId(item) {
      return 'search-option-' + item.path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
    },

    iconFor(group) {
      return 'app-icon-' + group.type
    },

    isCursor(item) {
      return !!this.flat[this.cursor] && this.flat[this.cursor].path === item.path
    },

    focus(item) {
      const index = this.flat.findIndex((o) => o.path === item.path)
      if (index > -1) this.cursor = index
    },

    move(delta) {
      if (!this.flat.length) return
      this.cursor = (this.cursor + delta + this.flat.length) % this.flat.length
      this.$nextTick(() => {
        const buttons = this.$refs.list ? this.$refs.list.querySelectorAll('button') : []
        const el = buttons[this.cursor]
        if (el && el.offsetTop < this.$refs.list.scrollTop) {
          this.$refs.list.scrollTop = el.offsetTop - 8
        } else if (el && el.offsetTop + el.offsetHeight > this.$refs.list.scrollTop + this.$refs.list.clientHeight) {
          this.$refs.list.scrollTop = el.offsetTop + el.offsetHeight - this.$refs.list.clientHeight + 8
        }
      })
    },

    go(item) {
      if (!item) return
      if (this.query) this.$store.commit('addRecentSearch', this.query)
      this.close()
      const path = (item.path || '').replace(/\/README$/, '')
      if (path && path !== this.$route.path) this.$router.push(path)
    },

    close() {
      this.$emit('close')
    },
  },
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 120ms ease; }
.fade-enter,
.fade-leave-to { opacity: 0; }
</style>

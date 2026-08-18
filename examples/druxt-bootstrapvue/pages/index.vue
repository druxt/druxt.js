<template>
  <div class="coc-shell">
    <button
      v-if="mobileMenuOpen"
      type="button"
      class="coc-backdrop"
      aria-label="Close menu"
      @click="mobileMenuOpen = false"
    />
    <aside class="coc-sidebar" :class="{ 'coc-sidebar-open': mobileMenuOpen }">
      <div class="px-3">
        <p class="mb-0 font-weight-bold" style="font-size: 17px">Content Ops</p>
        <p class="mb-0 small text-secondary">umami &middot; JSON:API</p>
      </div>
      <nav class="d-flex flex-column">
        <button
          v-for="item in navItems"
          :key="item.label"
          type="button"
          data-testid="coc-nav-item"
          :data-nav="item.label"
          class="coc-nav-item"
          :class="isNavActive(item) ? 'coc-nav-active' : 'coc-nav-muted'"
          @click="selectNav(item)"
        >{{ item.label }}</button>
      </nav>
      <div class="mt-auto px-3 small" style="line-height: 1.6">
        <p v-if="$auth.loggedIn" class="mb-2">
          Signed in as <strong class="text-white">{{ userName }}</strong>
        </p>
        <button
          v-else
          data-testid="coc-login"
          type="button"
          class="btn btn-sm btn-primary mb-2"
          @click="login"
        >
          Sign in to edit
        </button>
        <p v-if="!$auth.loggedIn" data-testid="coc-test-creds" class="mb-2 coc-creds">
          Test login: <strong class="text-white">admin</strong> /
          <strong class="text-white">druxt123</strong>
        </p>
        <p class="mb-0">
          Writes go straight to Drupal's JSON:API — a real OAuth2
          (Authorization Code + PKCE) round trip against the backend, not a
          mock. No Drupal admin UI in the loop.
        </p>
      </div>
    </aside>

    <main class="coc-main">
      <div class="coc-topbar">
        <button
          type="button"
          data-testid="coc-menu-toggle"
          class="coc-menu-toggle btn btn-sm btn-outline-secondary"
          aria-label="Open menu"
          @click="mobileMenuOpen = true"
        >&#9776;</button>
        <h1 class="mb-0" style="font-size: 20px">{{ sectionTitle }}</h1>
        <span class="badge badge-light coc-count">{{ countLabel }}</span>
        <div class="ml-auto d-flex align-items-center" style="gap: 8px">
          <span class="small text-muted">{{ dirtyLabel }}</span>
          <button
            v-if="section === 'content'"
            data-testid="coc-open-modal"
            type="button"
            class="btn btn-sm btn-primary"
            :disabled="!modalRecipe"
            @click="modalOpen = true"
          >
            Edit full record
          </button>
        </div>
      </div>

      <div v-if="error" data-testid="coc-banner" class="coc-banner">
        <strong class="flex-shrink-0">Save failed</strong>
        <div class="flex-grow-1 small">
          <p class="mb-1">{{ error.detail }}</p>
          <p class="mb-0 coc-mono">{{ error.path }}</p>
        </div>
        <button
          data-testid="coc-retry"
          type="button"
          class="btn btn-sm btn-outline-danger flex-shrink-0"
          @click="retry"
        >
          Retry
        </button>
        <button
          data-testid="coc-revert"
          type="button"
          class="btn btn-sm btn-link text-danger flex-shrink-0"
          @click="revert"
        >
          Revert
        </button>
      </div>

      <div class="coc-filters">
        <label class="d-flex flex-column">
          <span class="coc-filter-label">{{ section === 'content' ? 'Search title' : 'Search name' }}</span>
          <input
            v-model="q"
            data-testid="coc-search"
            type="text"
            placeholder="Filter…"
            class="form-control form-control-sm"
            style="min-width: 220px"
          />
        </label>
        <button
          v-if="section === 'content'"
          data-testid="coc-issues"
          type="button"
          class="btn btn-sm"
          :class="issuesOnly ? 'btn-warning' : 'btn-outline-secondary'"
          @click="issuesOnly = !issuesOnly"
        >
          Needs attention only
        </button>
        <span v-if="section === 'content'" class="ml-auto small text-muted">{{ issueSummary }}</span>
      </div>

      <div v-if="section === 'content'" class="coc-table-shell">
        <div class="coc-grid coc-head">
          <span>Type</span>
          <button
            data-testid="coc-sort-title"
            type="button"
            class="coc-sort-btn"
            @click="sortBy('title')"
          >
            Title {{ titleArrow }}
          </button>
          <span>Category</span>
          <span>Difficulty</span>
          <span>Prep (min)</span>
          <button
            data-testid="coc-sort-words"
            type="button"
            class="coc-sort-btn"
            @click="sortBy('words')"
          >
            Words {{ wordsArrow }}
          </button>
          <span>Updated</span>
          <span>State</span>
        </div>

        <div
          v-for="row in rows"
          :key="row.id"
          data-testid="coc-row"
          :data-id="row.id"
          class="coc-grid coc-row"
          :style="{ background: row.bg }"
        >
          <span class="px-3 py-2">
            <span class="badge badge-light coc-type">{{ row.typeLabel }}</span>
          </span>
          <div class="px-3 py-2 d-flex align-items-center" style="gap: 8px; min-width: 0">
            <span class="text-truncate">{{ row.title }}</span>
            <span
              v-if="row.issue"
              :title="row.issue"
              class="badge badge-warning flex-shrink-0"
              style="font-size: 11px"
            >{{ row.issue }}</span>
          </div>
          <span class="px-3 py-2 text-secondary">{{ row.category }}</span>
          <span class="px-2 py-1">
            <!-- Vue 2 cannot bind :value on <select> (only v-model), and
                 patching :selected does not reliably move a script-set
                 selection - so the key forces a remount whenever the value
                 changes. -->
            <select
              v-if="row.editable"
              :key="`difficulty-${row.difficulty}`"
              class="form-control form-control-sm"
              @change="patchCell(row, 'field_difficulty', $event.target.value)"
            >
              <!-- Storage values are lowercase (easy/medium/hard); the
                   capitalized labels are just presentation. -->
              <option value="" :selected="!row.difficulty">&mdash; not set &mdash;</option>
              <option value="easy" :selected="row.difficulty === 'easy'">Easy</option>
              <option value="medium" :selected="row.difficulty === 'medium'">Medium</option>
              <option value="hard" :selected="row.difficulty === 'hard'">Hard</option>
            </select>
            <span v-else class="text-muted">n/a</span>
          </span>
          <span class="px-2 py-1">
            <input
              v-if="row.editable"
              :value="row.prep"
              type="number"
              class="form-control form-control-sm"
              @change="patchCell(row, 'field_preparation_time', $event.target.value)"
            />
            <span v-else class="text-muted">n/a</span>
          </span>
          <span class="px-3 py-2 text-secondary">{{ row.words }}</span>
          <span class="px-3 py-2 text-muted" style="font-size: 13px">{{ row.updated }}</span>
          <span class="px-3 py-2" data-testid="coc-state">
            <span v-if="row.saving" class="coc-saving">
              <span class="coc-spinner"></span> Saving
            </span>
            <span v-else-if="row.saved" class="text-success small font-weight-bold">&#10003; Saved</span>
            <span v-else-if="row.failed" class="text-danger small font-weight-bold">&#9888; Failed</span>
            <span v-else class="text-muted small">&mdash;</span>
          </span>
        </div>

        <div class="coc-foot">
          <span class="small text-muted">
            b-table + b-pagination &middot; sorting and filtering are
            client-side over the fetched collection
          </span>
        </div>
      </div>

      <div v-else class="coc-table-shell">
        <div class="coc-grid coc-grid-taxonomy coc-head">
          <span>Vocabulary</span>
          <span>Name</span>
          <span>Updated</span>
          <span>State</span>
        </div>

        <div
          v-for="row in termRows"
          :key="row.id"
          data-testid="coc-term-row"
          :data-id="row.id"
          class="coc-grid coc-grid-taxonomy coc-row"
          :style="{ background: row.bg }"
        >
          <span class="px-3 py-2">
            <span class="badge badge-light coc-type">{{ row.typeLabel }}</span>
          </span>
          <span class="px-2 py-1">
            <input
              :value="row.name"
              type="text"
              class="coc-cell-input"
              data-testid="coc-term-name"
              @change="patchCell(row, 'name', $event.target.value)"
            />
          </span>
          <span class="px-3 py-2 text-muted" style="font-size: 13px">{{ row.updated }}</span>
          <span class="px-3 py-2" data-testid="coc-state">
            <span v-if="row.saving" class="coc-saving">
              <span class="coc-spinner"></span> Saving
            </span>
            <span v-else-if="row.saved" class="text-success small font-weight-bold">&#10003; Saved</span>
            <span v-else-if="row.failed" class="text-danger small font-weight-bold">&#9888; Failed</span>
            <span v-else class="text-muted small">&mdash;</span>
          </span>
        </div>

        <div class="coc-foot">
          <span class="small text-muted">
            Recipe categories and tags - the same optimistic single-cell
            editing as Content, over a different content type.
          </span>
        </div>
      </div>
    </main>

    <b-modal
      v-model="modalOpen"
      size="lg"
      hide-footer
    >
      <template #modal-title>
        <span class="coc-modal-title-main">Edit recipe</span>
        <span v-if="modalRecipe" class="coc-modal-title-sub">{{ modalRecipe.title }}</span>
      </template>
      <div data-testid="coc-modal" class="coc-modal-form">
        <p class="small text-muted">
          DruxtEntityForm renders the full node--recipe form from the Drupal
          form display. Anything beyond a single cell edit happens here rather
          than in the table.
        </p>
        <DruxtEntityForm
          v-if="modalOpen && modalRecipe"
          type="node--recipe"
          :uuid="modalRecipe.id"
          mode="default"
          @submit="onModalSubmit"
          @error="onModalError"
        />
      </div>
    </b-modal>
  </div>
</template>

<script>
// drupal-jsonapi-params is Babel-compiled ESM with no default export -
// same named import as the sibling examples.
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

// Strips markup for the word counts. Loops to a fixpoint so nested tags
// can't reform after one pass, and `>?` drops an unterminated trailing
// tag - single-pass regex stripping leaves both behind (CodeQL
// js/incomplete-multi-character-sanitization).
const stripTags = (html) => {
  let text = String(html || '')
  let previous
  do {
    previous = text
    text = text.replace(/<[^>]*>?/g, ' ')
  } while (text !== previous)
  return text
}
const words = (text) => (stripTags(text).trim().match(/\S+/g) || []).length

export default {
  layout: 'console',

  data: () => ({
    recipes: [],
    articles: [],
    // Taxonomy terms, keyed by the two vocabularies this backend actually
    // has - not a generic "all vocabularies" fetch.
    categories: [],
    tags: [],
    included: {},
    q: '',
    // Which section the main pane shows - driven by the sidebar, not a
    // separate control. 'content' covers recipes+articles (still narrowed
    // by `type`); 'taxonomy' covers categories+tags.
    section: 'content',
    type: 'all',
    issuesOnly: false,
    sort: 'updated',
    dir: -1,
    // Pending per-row overrides (optimistic while saving, kept on failure
    // so Retry has context). Cleared per-field once the server accepts it.
    // Shared across content and taxonomy rows - both key by resource id.
    edits: {},
    // Rows edited at all this session - drives the topbar counter, which
    // must survive the edits cleanup on successful saves.
    touched: {},
    status: {},
    error: null,
    modalOpen: false,
    mobileMenuOpen: false,
    savedTimers: {},
  }),

  async fetch() {
    const recipeParams = new DrupalJsonApiParams()
      .addFilter('status', '1')
      .addFields('node--recipe', [
        'title',
        'changed',
        'field_difficulty',
        'field_preparation_time',
        'field_summary',
        'field_recipe_category',
      ])
      .addInclude(['field_recipe_category'])
      .addFields('taxonomy_term--recipe_category', ['name'])
      .addPageLimit(50)

    const articleParams = new DrupalJsonApiParams()
      .addFilter('status', '1')
      .addFields('node--article', ['title', 'changed', 'body', 'field_tags'])
      .addInclude(['field_tags'])
      .addFields('taxonomy_term--tags', ['name'])
      .addPageLimit(50)

    const categoryParams = new DrupalJsonApiParams()
      .addFields('taxonomy_term--recipe_category', ['name', 'changed'])
      .addSort('name', 'ASC')
      .addPageLimit(50)

    const tagParams = new DrupalJsonApiParams()
      .addFields('taxonomy_term--tags', ['name', 'changed'])
      .addSort('name', 'ASC')
      .addPageLimit(50)

    const [recipeRes, articleRes, categoryRes, tagRes] = await Promise.all([
      this.$store.dispatch('druxt/getCollection', {
        type: 'node--recipe',
        query: recipeParams,
      }),
      this.$store.dispatch('druxt/getCollection', {
        type: 'node--article',
        query: articleParams,
      }),
      this.$store.dispatch('druxt/getCollection', {
        type: 'taxonomy_term--recipe_category',
        query: categoryParams,
      }),
      this.$store.dispatch('druxt/getCollection', {
        type: 'taxonomy_term--tags',
        query: tagParams,
      }),
    ])

    ;[...(recipeRes.included || []), ...(articleRes.included || [])].forEach(
      (resource) => {
        this.$set(this.included, resource.id, resource)
      }
    )

    this.recipes = recipeRes.data || []
    this.articles = articleRes.data || []
    this.categories = categoryRes.data || []
    this.tags = tagRes.data || []
  },

  computed: {
    userName() {
      const user = this.$auth.user || {}
      return user.name || user.email || user.sub || 'editor'
    },

    navItems() {
      return [
        { label: 'Content', section: 'content', type: 'all' },
        { label: 'Recipes', section: 'content', type: 'recipe' },
        { label: 'Articles', section: 'content', type: 'article' },
        { label: 'Taxonomy', section: 'taxonomy', type: null },
      ]
    },

    sectionTitle() {
      if (this.section === 'taxonomy') return 'Taxonomy'
      if (this.type === 'recipe') return 'Recipes'
      if (this.type === 'article') return 'Articles'
      return 'Content'
    },

    modalRecipe() {
      // The full-record editor targets the first recipe in the current
      // view (the prototype's topbar button edits the top row).
      const row = this.rows.find((r) => r.editable)
      if (!row) return null
      const resource = this.recipes.find((r) => r.id === row.id)
      return resource ? { id: resource.id, title: resource.attributes.title } : null
    },

    decorated() {
      return [
        ...this.recipes.map((r) => {
          const category = (this.names(r.relationships.field_recipe_category) || [])
            .filter(Boolean)
            .join(', ')
          return {
            id: r.id,
            type: 'node--recipe',
            typeLabel: 'Recipe',
            title: r.attributes.title,
            category,
            difficulty: r.attributes.field_difficulty || '',
            prep: r.attributes.field_preparation_time,
            words: words(r.attributes.field_summary),
            changed: r.attributes.changed,
            updated: this.fmtDate(r.attributes.changed),
            editable: true,
          }
        }),
        ...this.articles.map((a) => ({
          id: a.id,
          type: 'node--article',
          typeLabel: 'Article',
          title: a.attributes.title,
          category: (this.names(a.relationships.field_tags) || []).filter(Boolean).join(', '),
          difficulty: null,
          prep: null,
          words: words((a.attributes.body || {}).value),
          changed: a.attributes.changed,
          updated: this.fmtDate(a.attributes.changed),
          editable: false,
        })),
      ]
    },

    rows() {
      // Merge pending edits over the decorated base. Edits are keyed by
      // JSON:API field name (that is what patchCell PATCHes), while the
      // row properties use short display names.
      const value = (row, field, jsonapi) => {
        const edit = this.edits[row.id] || {}
        return jsonapi in edit ? edit[jsonapi] : row[field]
      }

      let out = this.decorated
        .map((row) => {
          const difficulty = value(row, 'difficulty', 'field_difficulty')
          const prep = value(row, 'prep', 'field_preparation_time')
          const issue =
            row.editable && !difficulty
              ? 'no difficulty'
              : row.words < 130
                ? 'thin body'
                : ''
          return { ...row, difficulty, prep, issue }
        })
        .filter((row) =>
          this.type === 'all' ? true : row.type === `node--${this.type}`
        )
        .filter((row) =>
          this.q
            ? row.title.toLowerCase().includes(this.q.toLowerCase())
            : true
        )
        .filter((row) => (this.issuesOnly ? !!row.issue : true))

      const dir = this.dir
      if (this.sort === 'title') {
        out = out.sort((a, b) => dir * a.title.localeCompare(b.title))
      } else if (this.sort === 'words') {
        out = out.sort((a, b) => dir * (a.words - b.words))
      } else {
        out = out.sort((a, b) => dir * a.changed.localeCompare(b.changed))
      }

      return out.map((row) => this.withState(row))
    },

    decoratedTerms() {
      return [
        ...this.categories.map((t) => ({
          id: t.id,
          type: 'taxonomy_term--recipe_category',
          typeLabel: 'Category',
          name: t.attributes.name,
          changed: t.attributes.changed,
          updated: this.fmtDate(t.attributes.changed),
          editable: true,
        })),
        ...this.tags.map((t) => ({
          id: t.id,
          type: 'taxonomy_term--tags',
          typeLabel: 'Tag',
          name: t.attributes.name,
          changed: t.attributes.changed,
          updated: this.fmtDate(t.attributes.changed),
          editable: true,
        })),
      ]
    },

    termRows() {
      const value = (row) => {
        const edit = this.edits[row.id] || {}
        return 'name' in edit ? edit.name : row.name
      }

      let out = this.decoratedTerms
        .map((row) => ({ ...row, name: value(row) }))
        .filter((row) =>
          this.q ? row.name.toLowerCase().includes(this.q.toLowerCase()) : true
        )
        .sort((a, b) => a.typeLabel.localeCompare(b.typeLabel) || a.name.localeCompare(b.name))

      return out.map((row) => this.withState(row))
    },

    countLabel() {
      if (this.section === 'taxonomy') {
        return `${this.termRows.length} of ${this.decoratedTerms.length} terms`
      }
      return `${this.rows.length} of ${this.decorated.length} items`
    },

    issueCount() {
      return this.decorated.filter((r) => {
        // Edits are keyed by JSON:API field name - see rows().
        const edit = this.edits[r.id] || {}
        const difficulty = 'field_difficulty' in edit ? edit.field_difficulty : r.difficulty
        return (r.editable && !difficulty) || r.words < 130
      }).length
    },

    issueSummary() {
      return `${this.issueCount} items need attention · missing difficulty or a thin body`
    },

    dirtyLabel() {
      const n = Object.keys(this.touched).length
      return n ? `${n} item(s) edited this session` : 'no local edits'
    },

    titleArrow() {
      return this.sort === 'title' ? (this.dir > 0 ? '▲' : '▼') : ''
    },

    wordsArrow() {
      return this.sort === 'words' ? (this.dir > 0 ? '▲' : '▼') : ''
    },
  },

  beforeDestroy() {
    Object.values(this.savedTimers).forEach(clearTimeout)
  },

  methods: {
    // Multi-value relationships (category, tags) are arrays of references
    // into the shared `included` map built during fetch.
    names(relationship) {
      return ((relationship || {}).data || []).map((ref) => {
        const term = this.included[ref.id]
        return term && term.attributes && term.attributes.name
      })
    },

    // Shared by rows() and termRows(): overlays live save state (from the
    // one patchCell path both sections use) onto an already-edit-merged row.
    withState(row) {
      const st = this.status[row.id]
      return {
        ...row,
        difficulty: row.difficulty || '',
        prep: row.prep === null || row.prep === undefined ? '' : row.prep,
        hasIssue: !!row.issue,
        bg: st === 'failed' ? '#fdf2f3' : st === 'saving' ? '#f1f8ff' : '#fff',
        saving: st === 'saving',
        saved: st === 'saved',
        failed: st === 'failed',
      }
    },

    fmtDate(iso) {
      try {
        return new Intl.DateTimeFormat('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(new Date(iso))
      } catch (e) {
        return iso
      }
    },

    login() {
      this.$auth.loginWith('drupal-authorization_code')
    },

    isNavActive(item) {
      if (item.section !== this.section) return false
      return item.section === 'taxonomy' ? true : item.type === this.type
    },

    selectNav(item) {
      this.section = item.section
      if (item.type) this.type = item.type
      this.q = ''
      this.mobileMenuOpen = false
    },

    sortBy(field) {
      if (this.sort === field) this.dir = -this.dir
      else {
        this.sort = field
        this.dir = 1
      }
    },

    // Optimistic single-cell edit: the cell updates immediately, the row
    // shows Saving, then Saved or Failed - the UI never waits on the
    // round-trip before showing the change. Shared by the Content table
    // (field_difficulty/field_preparation_time) and the Taxonomy table
    // (name) - patchCell only needs row.type/row.id, not a content-specific
    // shape.
    async patchCell(row, field, rawValue) {
      const value =
        field === 'field_preparation_time' ? Number(rawValue) : rawValue || null

      this.$set(this.edits, row.id, {
        ...(this.edits[row.id] || {}),
        [field]: value,
      })
      this.$set(this.touched, row.id, true)
      this.$set(this.status, row.id, 'saving')
      this.error = null

      try {
        const response = await this.$druxt.updateResource({
          type: row.type,
          id: row.id,
          attributes: { [field]: value },
        })
        // Keep the Vuex druxt store fresh: DruxtEntityForm reads its
        // resource from the store, and a stale `changed` timestamp there
        // makes the next full-form PATCH fail Drupal's edit-conflict
        // check on that field. No `prefix` is passed on purpose: this
        // page's collections are stored under the undefined prefix (same
        // slot DruxtEntityForm reads on this route), and the full PATCH
        // response deep-merges over the sparse collection entry.
        this.$store.commit('druxt/addResource', {
          resource: {
            data: response.data.data,
            links: response.data.links,
          },
        })
        // Server truth: write the accepted value back into the base
        // resource so a later Revert restores what the server actually
        // holds, not what the page loaded with.
        const base = [
          ...this.recipes,
          ...this.articles,
          ...this.categories,
          ...this.tags,
        ].find((r) => r.id === row.id)
        if (base) this.$set(base.attributes, field, value)
        const pending = { ...(this.edits[row.id] || {}) }
        delete pending[field]
        if (Object.keys(pending).length) this.$set(this.edits, row.id, pending)
        else this.$delete(this.edits, row.id)
        this.$set(this.status, row.id, 'saved')
        clearTimeout(this.savedTimers[row.id])
        this.savedTimers[row.id] = setTimeout(() => {
          if (this.status[row.id] === 'saved') {
            this.$delete(this.status, row.id)
          }
        }, 2200)
      } catch (err) {
        this.$set(this.status, row.id, 'failed')
        const response = (err.response || {}).data || {}
        this.error = {
          id: row.id,
          field,
          value,
          detail:
            ((((response.errors || [])[0] || {}).detail) ||
              err.message ||
              'The server rejected the change.')
            .split('\n')
            .pop(),
          path: `PATCH /jsonapi/${row.type.replace('--', '/')}/${row.id}`,
        }
      }
    },

    retry() {
      if (!this.error) return
      const found = [...this.decorated, ...this.decoratedTerms].find(
        (r) => r.id === this.error.id
      )
      if (!found) return
      const row = { id: this.error.id, type: found.type }
      const field = this.error.field
      this.patchCell(row, field, this.error.value)
    },

    // Revert-to-server-value: drop the local edit, clear the banner.
    revert() {
      if (!this.error) return
      this.$delete(this.edits, this.error.id)
      this.$delete(this.status, this.error.id)
      this.error = null
    },

    onModalSubmit(resource) {
      // Refresh the local row from the PATCH response so the table
      // reflects the full-form edit immediately.
      const attributes = (resource || {}).attributes || {}
      const row = this.recipes.find((r) => r.id === resource.id)
      if (row) {
        Object.assign(row.attributes, attributes)
      }
      // Refresh the Vuex druxt store as well: DruxtEntityForm shares
      // attribute object references with the stored resource (edits leak
      // in live), but its own addResource commit is a no-op (wrong
      // payload shape), so without this the `changed` timestamp goes
      // stale and the next full-form PATCH trips Drupal's edit-conflict
      // check.
      this.$store.commit('druxt/addResource', {
        resource: {
          data: resource,
          links: resource.links,
        },
      })
      // Any pending single-cell edit for this row is now server truth.
      this.$delete(this.edits, resource.id)
      this.modalOpen = false
    },

    onModalError(response) {
      const detail = ((((response || {}).errors || [])[0] || {}).detail) ||
        'The full-form save was rejected.'
      this.error = {
        id: this.modalRecipe ? this.modalRecipe.id : null,
        field: null,
        value: null,
        detail,
        path: `PATCH /jsonapi/node/recipe/${this.modalRecipe ? this.modalRecipe.id : ''}`,
      }
    },
  },
}
</script>

<style scoped>
.coc-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 232px 1fr;
}
.coc-sidebar {
  background: #343a40;
  color: #fff;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.coc-menu-toggle {
  display: none;
}
/* Below this, the sidebar is a slide-in drawer instead of a grid column -
   232px permanently reserved would leave the table with no usable width
   on a phone. */
@media (max-width: 768px) {
  .coc-shell {
    grid-template-columns: 1fr;
  }
  .coc-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: 232px;
    max-width: 82vw;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.25);
  }
  .coc-sidebar.coc-sidebar-open {
    transform: translateX(0);
  }
  .coc-menu-toggle {
    display: inline-flex;
  }
}
.coc-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 30;
  border: 0;
  padding: 0;
}
.coc-nav-item {
  padding: 9px 20px;
  font-size: 14px;
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: none;
  cursor: pointer;
}
.coc-nav-active {
  background: #007bff;
  font-weight: 600;
  color: #fff;
}
.coc-nav-muted {
  color: #ced4da;
}
.coc-nav-muted:hover {
  color: #fff;
}
.coc-creds {
  font-family: ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: #ced4da;
}
.coc-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.coc-topbar {
  background: #fff;
  border-bottom: 1px solid #dee2e6;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.coc-count {
  border: 1px solid #dee2e6;
  font-size: 12px;
  color: #6c757d;
  padding: 3px 8px;
}
.coc-banner {
  margin: 16px 24px 0;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 0.25rem;
  color: #721c24;
  padding: 12px 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.coc-mono {
  font-family: ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: #8a5054;
}
.coc-filters {
  padding: 16px 24px 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}
/* Bootstrap gives labels margin-bottom .5rem, which offsets the filter
   controls from their siblings under align-items: flex-end. */
.coc-filters label {
  margin-bottom: 0;
}
.coc-filter-label {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
}
.coc-table-shell {
  margin: 8px 24px 24px;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  overflow: auto;
}
.coc-grid {
  display: grid;
  grid-template-columns: 88px minmax(240px, 2fr) 150px 132px 108px 78px 130px 96px;
  align-items: center;
  font-size: 14px;
}
.coc-grid-taxonomy {
  grid-template-columns: 120px minmax(240px, 1fr) 130px 96px;
}
/* Term names edit in place, but the design's tables read as text - the
   input only looks like one once you're interacting with it. */
.coc-cell-input {
  display: block;
  width: 100%;
  padding: 4px 6px;
  font-size: 14px;
  font-family: inherit;
  color: #212529;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.25rem;
}
.coc-cell-input:hover {
  border-color: #ced4da;
  background: #fff;
}
.coc-cell-input:focus {
  border-color: #80bdff;
  background: #fff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: 0;
}
.coc-head {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  font-size: 12px;
  font-weight: 700;
  color: #495057;
}
.coc-head > span,
.coc-head > button {
  padding: 10px 12px;
}
.coc-sort-btn {
  border: 0;
  background: none;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  color: #495057;
  cursor: pointer;
}
.coc-row {
  border-bottom: 1px solid #dee2e6;
}
.coc-type {
  border: 1px solid #dee2e6;
  font-size: 11px;
  color: #495057;
}
.coc-saving {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #007bff;
}
.coc-spinner {
  width: 11px;
  height: 11px;
  border: 2px solid #007bff;
  border-right-color: transparent;
  border-radius: 999px;
  display: block;
  animation: cocSpin 0.7s linear infinite;
}
.coc-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
}
@keyframes cocSpin {
  to {
    transform: rotate(360deg);
  }
}
/* DruxtEntityForm renders Drupal's classless form markup - label > strong
   + br + div > control, and a bare <details> for reference fields. Styled
   from the outside only; no field markup is changed. */
.coc-modal-title-main {
  font-size: 18px;
  font-weight: 600;
}
.coc-modal-title-sub {
  margin-left: 12px;
  font-size: 13px;
  font-weight: 400;
  color: #6c757d;
}
/* DruxtEntityForm's own rendering nests two levels of wrapper <div>
   (DruxtEntityForm's, then DruxtWrapper's) before each field's own
   wrapper <div>. Fields with a custom Form.vue (number, options_select,
   boolean_checkbox) render their label directly inside that div, but any
   field type without one falls through to a generic fallback that adds
   one more wrapper <div> first - confirmed via live DOM inspection, not
   guessed. Collapsing both levels with `display: contents` promotes each
   label/details straight into the grid without touching any field's own
   markup - grid-column is set on the label/details themselves, which we
   do control. */
.coc-modal-form ::v-deep > div > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.coc-modal-form ::v-deep > div > div > div,
.coc-modal-form ::v-deep > div > div > div > div {
  display: contents;
}
.coc-modal-form ::v-deep label {
  display: block;
  grid-column: 1 / -1;
  margin: 0;
}
.coc-modal-form ::v-deep label > strong {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #212529;
}
/* Preparation/cooking time sit side by side, matching the design comp -
   the only two fields called out for a paired layout. */
.coc-modal-form ::v-deep .field_preparation_time,
.coc-modal-form ::v-deep .field_cooking_time {
  grid-column: span 1;
}
.coc-modal-form ::v-deep input:not([type='checkbox']):not([type='radio']),
.coc-modal-form ::v-deep textarea,
.coc-modal-form ::v-deep select {
  display: block;
  width: 100%;
  padding: 7px 11px;
  font-size: 15px;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-family: inherit;
}
.coc-modal-form ::v-deep input:focus,
.coc-modal-form ::v-deep textarea:focus,
.coc-modal-form ::v-deep select:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: 0;
}
/* Checkbox fields (schema.type boolean_checkbox) get their own wrapper
   component (components/druxt/field/boolean_checkbox/Form.vue) instead of
   DruxtField's default <strong>Label:</strong><br><div><input></div> - a
   plain class selector here rather than a :has()-based reflow, which this
   toolchain's older vue-loader/postcss fails to parse inside ::v-deep. */
.coc-modal-form ::v-deep .coc-field-checkbox {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
}
.coc-modal-form ::v-deep .coc-field-checkbox input[type='checkbox'] {
  flex: none;
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: #007bff;
  cursor: pointer;
}
.coc-modal-form ::v-deep .coc-field-checkbox strong {
  display: inline;
  margin-bottom: 0;
}
/* Submit/Reset (DruxtEntityFormButtons) - distinguished by id, the only
   attribute that component sets. Discard should never look like save. */
.coc-modal-form ::v-deep #submit {
  background-color: #007bff;
  border: 1px solid #007bff;
  color: #fff;
  border-radius: 0.25rem;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.coc-modal-form ::v-deep #submit:hover {
  background-color: #0069d9;
  border-color: #0062cc;
}
.coc-modal-form ::v-deep #reset {
  border: 0;
  background: none;
  color: #6c757d;
  padding: 8px 6px;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}
.coc-modal-form ::v-deep #reset:hover {
  color: #212529;
}
/* Reference fields (field_recipe_category, field_tags, field_media_image)
   render as a bare <details><DruxtEntityForm/></details> - a nested edit
   form for the referenced entity itself, not a picker. Framing it as a
   panel makes the nesting read as deliberate rather than surprising. No
   <summary> is rendered, so the browser's default disclosure label
   ("Details") is what shows - CSS alone can't replace that text. */
.coc-modal-form ::v-deep details {
  grid-column: 1 / -1;
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #dee2e6;
  border-left: 3px solid #adb5bd;
  border-radius: 0.25rem;
  background: #f8f9fa;
}
.coc-modal-form ::v-deep details[open] {
  background: #fff;
}
/* Nested labels inside a reference field's own sub-form aren't part of the
   outer grid (they're a level deeper, in that field's own DruxtEntityForm),
   so they need their own margin back rather than relying on the grid gap. */
.coc-modal-form ::v-deep details label {
  margin: 14px 0 20px;
}
</style>

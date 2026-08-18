<template>
  <div>
    <h1>Reactive filtering</h1>
    <p>
      Live re-ranking over a multi-value <code>field_ingredients</code> list:
      toggle ingredient chips or type into the free-text input and the recipes
      re-rank by ingredient coverage, with a 250ms debounced watcher on the
      input. No backend filtering — everything is computed client-side from
      one JSON:API collection request.
    </p>

    <div class="rf-panel">
      <div class="rf-intro">
        <h2>What can I cook tonight?</h2>
        <p class="rf-sub">
          Tell it what's in the kitchen. Recipes re-rank by how much of their
          ingredient list you already have.
        </p>
      </div>

      <div class="rf-controls">
        <label class="rf-label">
          <span>Ingredients on hand</span>
          <input
            id="rf-input"
            v-model="query"
            type="text"
            placeholder="onion, garlic, flour…"
            @input="onQuery"
          />
        </label>

        <div class="rf-chips">
          <button
            v-for="label of chipLabels"
            :key="label"
            class="rf-chip"
            :class="{ 'rf-chip--active': pantry.includes(label) }"
            type="button"
            @click="toggle(label)"
            v-text="label"
          />
        </div>

        <div class="rf-status">
          <span v-text="typing ? 'watcher: debouncing (250ms)…' : 'watcher: idle'" />
          <span v-text="termsLabel" />
        </div>
      </div>

      <div class="rf-results">
        <div v-for="recipe of ranked" :key="recipe.id" class="rf-row">
          <img :src="recipe.img" :alt="recipe.title" />
          <div class="rf-meta">
            <h3 v-text="recipe.title" />
            <p class="rf-detail" v-text="recipe.detail" />
          </div>
          <div class="rf-match">
            <div class="rf-bar">
              <div class="rf-bar-fill" :style="{ width: recipe.pct + '%' }" />
            </div>
            <span class="rf-match-label" v-text="recipe.matchLabel" />
          </div>
          <span class="rf-pct" v-text="recipe.pctLabel" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

const CHIPS = [
  'onion',
  'garlic',
  'tomatoes',
  'flour',
  'butter',
  'eggs',
  'milk',
  'sugar',
  'potatoes',
  'mushrooms',
]

export default {
  data: () => ({
    recipes: [],
    chipLabels: CHIPS,
    pantry: ['onion', 'garlic'],
    query: '',
    applied: '',
    typing: false,
    timer: undefined,
  }),

  async fetch() {
    const type = 'node--recipe'
    const resources = await this.$store.dispatch('druxt/getCollection', {
      type,
      query: new DrupalJsonApiParams()
        .addFilter('status', '1')
        .addFields(type, [
          'title',
          'path',
          'field_ingredients',
          'field_difficulty',
          'field_preparation_time',
          'field_cooking_time',
          'field_media_image',
          'field_recipe_category',
        ])
        .addInclude([
          'field_media_image',
          'field_media_image.field_media_image',
          'field_recipe_category',
        ])
        .addFields('media--image', ['field_media_image'])
        .addFields('file--file', ['uri'])
        .addFields('taxonomy_term--recipe_category', ['name'])
        .addPageLimit(10),
    })

    const included = Object.fromEntries(
      (resources.included || []).map((resource) => [resource.id, resource])
    )
    // Relationship data is an array for multi-value fields (category) and
    // a plain object for single-value fields (image refs) - normalize to
    // the first reference either way.
    const first = (relationship) => {
      const data = (relationship || {}).data
      return Array.isArray(data) ? data[0] : data
    }
    const imageSrc = (entity) => {
      const mediaRef = first(entity.relationships.field_media_image)
      const media = mediaRef && included[mediaRef.id]
      const fileRef = media && first(media.relationships.field_media_image)
      const file = fileRef && included[fileRef.id]
      const uri = file && file.attributes.uri.value
      const relative = uri && uri.replace(/^public:\/\//, '')
      // Pre-generated backend derivative (druxt_thumb_4_3, 240x180) rather
      // than the full-size original for a 72px row thumbnail.
      return (
        relative &&
        `/sites/default/files/styles/druxt_thumb_4_3/public/${relative}`
      )
    }
    const category = (entity) => {
      const term = included[first(entity.relationships.field_recipe_category).id]
      return term && term.attributes.name
    }

    this.recipes = resources.data.map((resource) => {
      const entity = resource
      const attributes = entity.attributes
      const prep = attributes.field_preparation_time || 0
      const cook = attributes.field_cooking_time || 0
      return {
        id: entity.id,
        title: attributes.title,
        ingredients: attributes.field_ingredients || [],
        img: imageSrc(entity),
        detail: [
          (category(entity) || attributes.field_difficulty || '')
            .toString()
            .toLowerCase(),
          prep + cook ? `${prep + cook} min` : '',
        ]
          .filter(Boolean)
          .join(' · '),
      }
    })
  },

  computed: {
    terms: ({ applied, pantry }) => {
      const typed = applied
        .split(',')
        .map((term) => term.trim().toLowerCase())
        .filter(Boolean)
      return Array.from(new Set(pantry.concat(typed)))
    },

    termsLabel: ({ terms }) =>
      terms.length
        ? 'matching on: ' + terms.join(', ')
        : 'no ingredients selected',

    ranked: ({ recipes, terms }) =>
      recipes
        .map((recipe) => {
          const matched = terms.length
            ? recipe.ingredients.filter((ingredient) =>
                terms.some((term) =>
                  ingredient.toLowerCase().includes(term)
                )
              ).length
            : 0
          const total = recipe.ingredients.length
          const pct = terms.length && total
            ? Math.round((matched / total) * 100)
            : 0
          return {
            ...recipe,
            pct,
            pctLabel: terms.length ? pct + '%' : '—',
            matchLabel: terms.length
              ? `${matched} of ${total} ingredients`
              : `${total} ingredients`,
          }
        })
        .sort(
          (a, b) => b.pct - a.pct || a.title.localeCompare(b.title)
        )
        .slice(0, 6),
  },

  beforeDestroy() {
    clearTimeout(this.timer)
  },

  methods: {
    onQuery() {
      this.typing = true
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.applied = this.query
        this.typing = false
      }, 250)
    },

    toggle(term) {
      this.pantry = this.pantry.includes(term)
        ? this.pantry.filter((t) => t !== term)
        : this.pantry.concat(term)
    },
  },
}
</script>

<style scoped>
.rf-panel {
  border: 1px solid var(--rule, #cfcfc9);
  background: #fff;
  margin-top: 32px;
}

.rf-intro {
  border-bottom: 1px solid var(--ink, #111110);
  padding: 24px 32px;
}

.rf-intro h2 {
  margin: 0 0 8px;
}

.rf-sub {
  margin: 0;
  max-width: 62ch;
  font-size: 15px;
  line-height: 1.6;
}

.rf-controls {
  border-bottom: 1px solid var(--ink, #111110);
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rf-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 520px;
}

.rf-label span {
  font-family: var(--mono, ui-monospace, Menlo, monospace);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted, #6f6f6a);
}

.rf-label input {
  border: 1px solid var(--ink, #111110);
  background: #fff;
  padding: 12px 14px;
  font-family: var(--mono, ui-monospace, Menlo, monospace);
  font-size: 15px;
  line-height: 1.2;
  color: var(--ink, #111110);
  border-radius: 0;
}

.rf-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rf-chip {
  border: 1px solid var(--rule, #cfcfc9);
  background: #fff;
  color: #3d3d3a;
  padding: 7px 12px;
  font-family: var(--mono, ui-monospace, Menlo, monospace);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  border-radius: 0;
}

.rf-chip:hover {
  border-color: var(--ink, #111110);
  color: var(--ink, #111110);
  background: #fff;
}

.rf-chip--active,
.rf-chip--active:hover {
  border-color: var(--ink, #111110);
  background: var(--ink, #111110);
  color: #fff;
}

.rf-status {
  display: flex;
  gap: 20px;
  align-items: center;
  font-family: var(--mono, ui-monospace, Menlo, monospace);
  font-size: 12px;
  color: var(--muted, #6f6f6a);
}

.rf-results {
  padding: 8px 32px 32px;
}

.rf-row {
  display: grid;
  grid-template-columns: 72px 1fr 200px 96px;
  gap: 24px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--hairline, #e4e4de);
}

.rf-row img {
  width: 72px;
  height: 72px;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  display: block;
}

.rf-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rf-meta h3 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
}

.rf-detail {
  margin: 0;
  font-family: var(--mono, ui-monospace, Menlo, monospace);
  font-size: 12px;
  line-height: 1.5;
  color: var(--muted, #6f6f6a);
}

.rf-match {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rf-bar {
  height: 8px;
  border: 1px solid var(--rule, #cfcfc9);
}

.rf-bar-fill {
  height: 100%;
  background: var(--ink, #111110);
}

.rf-match-label {
  font-family: var(--mono, ui-monospace, Menlo, monospace);
  font-size: 11px;
  color: var(--muted, #6f6f6a);
}

.rf-pct {
  font-family: var(--mono, ui-monospace, Menlo, monospace);
  font-size: 20px;
  text-align: right;
}
</style>

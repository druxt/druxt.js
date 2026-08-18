<template>
  <article class="card lg:card-side bg-base-100 shadow-md">
    <figure v-if="$scopedSlots.field_media_image" class="lg:w-2/5">
      <slot name="field_media_image" />
    </figure>

    <div class="card-body">
      <h1 class="card-title font-heading text-3xl">{{ entity.attributes.title }}</h1>
      <div v-if="summary" class="text-base-content/80" v-html="summary" />

      <div class="flex flex-wrap items-center gap-2 my-2">
        <span v-if="category" class="badge bg-accent text-accent-content border-0 font-semibold">{{ category }}</span>
        <span v-if="entity.attributes.field_difficulty" class="badge badge-secondary badge-lg capitalize">{{ entity.attributes.field_difficulty }}</span>
        <span v-if="entity.attributes.field_preparation_time" class="badge badge-outline">Prep {{ entity.attributes.field_preparation_time }} min</span>
        <span v-if="entity.attributes.field_cooking_time" class="badge badge-outline">Cook {{ entity.attributes.field_cooking_time }} min</span>
        <span v-if="entity.attributes.field_number_of_servings" class="badge badge-outline">Serves {{ entity.attributes.field_number_of_servings }}</span>
      </div>

      <button
        type="button"
        data-testid="rb-detail-save"
        class="btn btn-primary border-0 font-semibold self-start mt-1"
        :class="{ 'btn-secondary': saved }"
        @click="toggleSave"
      >{{ saved ? 'Saved to box' : 'Save to box' }}</button>

      <div v-if="ingredients.length" class="mt-4">
        <h2 class="font-heading text-xl mb-2">Ingredients</h2>
        <ul class="list-disc list-inside space-y-1">
          <li v-for="(ingredient, index) of ingredients" :key="index">{{ ingredient }}</li>
        </ul>
      </div>

      <div v-if="instructions" class="mt-4">
        <h2 class="font-heading text-xl mb-2">Instructions</h2>
        <div class="prose max-w-none" v-html="instructions" />
      </div>
    </div>
  </article>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'

/**
 * Extract renderable HTML from a Drupal formatted text field value, which
 * JSON:API represents as `{ value, format, processed }` rather than a
 * plain string.
 *
 * @param {object|string|undefined} field - The field's JSON:API attribute value.
 * @returns {string} The pre-sanitized `processed` HTML, or the raw value if
 *   `field` is already a plain string.
 */
function formattedText (field) {
  if (!field) return ''
  return typeof field === 'string' ? field : field.processed || field.value || ''
}

export default {
  mixins: [DruxtEntityMixin],

  data: () => ({
    ready: false,
  }),

  mounted() {
    this.ready = true
  },

  computed: {
    ingredients: ({ entity }) => [].concat(entity.attributes.field_ingredients || []).filter(Boolean),

    // Formatted text fields (text_long/text_with_summary) are JSON:API
    // objects (`{ value, format, processed }`), not plain strings - render
    // the pre-sanitized `processed` HTML, not the raw field value.
    summary: ({ entity }) => formattedText(entity.attributes.field_summary),
    instructions: ({ entity }) => formattedText(entity.attributes.field_recipe_instruction),

    // False during SSR and the first client render (the box is restored
    // from localStorage after mount), so hydration always matches.
    saved: ({ ready, entity, $store }) =>
      ready && $store.getters['recipeBox/has'](entity.id),

    category: ({ entity, $store }) => {
      // Multi-value relationship - data is an array of references.
      const data = ((entity.relationships || {}).field_recipe_category || {}).data
      const ref = Array.isArray(data) ? data[0] : data
      if (!ref) return null
      // The druxt store indexes resources[type][id][prefix] (prefix =
      // langcode) - resolve whichever prefix the term was stored under.
      const byId = (($store.state.druxt.resources[ref.type] || {})[ref.id]) || {}
      const term = (Object.values(byId)[0] || {}).data
      return (term && term.attributes && term.attributes.name) || null
    },
  },

  methods: {
    toggleSave() {
      const id = this.entity.id
      if (this.$store.getters['recipeBox/has'](id)) {
        this.$store.commit('recipeBox/REMOVE', id)
      } else {
        this.$store.commit('recipeBox/ADD', id)
      }
    },
  },

  druxt: {
    query: {
      fields: [
        'title',
        'field_media_image',
        'field_summary',
        'field_difficulty',
        'field_preparation_time',
        'field_cooking_time',
        'field_number_of_servings',
        'field_recipe_category',
        'field_ingredients',
        'field_recipe_instruction',
      ],
      include: ['field_recipe_category'],
    },
  },
}
</script>

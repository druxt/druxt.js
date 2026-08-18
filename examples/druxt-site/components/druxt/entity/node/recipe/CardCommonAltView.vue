<template>
  <NuxtLink :to="to" class="recipe-teaser">
    <slot name="field_media_image" />
    <p class="recipe-teaser__category">
      <slot name="field_recipe_category" />
    </p>
    <h3 class="recipe-teaser__title" v-text="title" />
    <p v-if="meta" class="recipe-teaser__meta" v-text="meta" />
  </NuxtLink>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'

export default {
  mixins: [DruxtEntityMixin],

  computed: {
    title: ({ entity }) => entity.attributes.title,
    to: ({ entity }) => ['/', entity.attributes.path.langcode, entity.attributes.path.alias].join(''),
    meta() {
      const a = this.entity.attributes
      const parts = []
      if (a.field_difficulty) parts.push(a.field_difficulty[0].toUpperCase() + a.field_difficulty.slice(1))
      if (a.field_preparation_time) parts.push(`${a.field_preparation_time} min`)
      if (a.field_number_of_servings) parts.push(`serves ${a.field_number_of_servings}`)
      return parts.join(' · ')
    },
  },

  druxt: {
    query: {
      include: ['field_media_image', 'field_media_image.field_media_image', 'field_recipe_category'],
      fields: [
        'path',
        'title',
        'field_media_image',
        'field_difficulty',
        'field_preparation_time',
        'field_number_of_servings',
        'field_recipe_category',
      ],
    },
  },
}
</script>

<style scoped>
.recipe-teaser {
  display: block;
  color: var(--ink);
}
.recipe-teaser ::v-deep img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}
.recipe-teaser__category {
  margin: var(--space-1) 0 4px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.recipe-teaser__title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
}
.recipe-teaser__meta {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
}
</style>

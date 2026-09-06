<template>
  <NuxtLink :to="to" class="article-teaser">
    <slot name="field_media_image" />
    <span class="article-teaser__title" v-text="title" />
    <span class="article-teaser__author"><slot name="uid" /></span>
  </NuxtLink>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'

export default {
  mixins: [DruxtEntityMixin],

  computed: {
    title: ({ entity }) => entity.attributes.title,
    to: ({ entity }) => ['/', entity.attributes.path.langcode, entity.attributes.path.alias].join(''),
  },

  druxt: {
    query: {
      include: ['field_media_image', 'field_media_image.field_media_image', 'uid'],
      fields: ['path', 'title', 'field_media_image', 'uid'],
    },
  },
}
</script>

<style scoped>
.article-teaser {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  color: var(--ink);
}
.article-teaser ::v-deep img {
  display: block;
  flex: none;
  width: 64px;
  height: 64px;
  object-fit: cover;
}
.article-teaser__title {
  flex: 1;
  font-size: 16px;
}
.article-teaser__author {
  flex: none;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}
</style>

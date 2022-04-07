<template>
  <NuxtLink :to="to">
    <h2 v-text="title" />
    <slot name="field_media_image" />
  </NuxtLink>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'
export default {
  mixins: [DruxtEntityMixin],
  computed: {
    title: ({ entity }) => entity.attributes.title,
    to: ({ entity }) => [entity.attributes.path.langcode, entity.attributes.path.alias].join(''),
  },
  druxt: {
    query: {
      fields: ['path', 'field_media_image', 'title']
    }
  }
}
</script>

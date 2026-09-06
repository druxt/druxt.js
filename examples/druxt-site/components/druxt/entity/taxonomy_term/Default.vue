<template>
  <NuxtLink v-if="to" :to="to" class="taxonomy-term">{{ entity.attributes.name }}</NuxtLink>
  <span v-else v-text="entity.attributes.name" />
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'

export default {
  mixins: [DruxtEntityMixin],

  computed: {
    to: ({ entity }) =>
      entity.attributes.path
        ? ['/', entity.attributes.path.langcode, entity.attributes.path.alias].join('')
        : undefined,
  },

  druxt: {
    query: {
      fields: ['name', 'path'],
    },
  },
}
</script>

<style scoped>
.taxonomy-term {
  display: inline-block;
  padding: 3px 10px;
  border: 1px solid var(--rule);
  color: var(--ink);
}
.taxonomy-term:hover {
  border-color: var(--ink);
}
</style>

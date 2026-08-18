<template>
  <div v-if="!$fetchState.pending" class="druxt-card-grid">
    <DruxtEntity
      v-for="item of resources.data"
      :key="item.id"
      mode="card"
      :type="type"
      :uuid="item.id"
    />
  </div>
  <div v-else>Loading...</div>
</template>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

/**
 * Example of a custom module built on top of Druxt core packages: a card
 * grid that fetches a bundle's most recent published entities and renders
 * each one via `DruxtEntity`. Not part of `druxt.js` — this is the kind of
 * component a site author writes themselves.
 */
export default {
  name: 'DruxtCardGrid',

  props: {
    limit: {
      type: Number,
      default: 6,
    },
    type: {
      type: String,
      required: true,
    },
  },

  data: () => ({
    resources: { data: [] },
  }),

  async fetch() {
    this.resources = await this.$store.dispatch('druxt/getCollection', {
      type: this.type,
      query: new DrupalJsonApiParams()
        .addFilter('status', '1')
        .addFields(this.type, ['id'])
        .addPageLimit(this.limit),
    })
  },
}
</script>

<style scoped>
.druxt-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}
</style>

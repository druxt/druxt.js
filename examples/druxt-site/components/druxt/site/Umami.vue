<template>
  <div>
    <div class="examples-bar">
      <NuxtLink to="/examples">DruxtJS pattern examples &rarr;</NuxtLink>
    </div>
    <DruxtBlockRegion
      v-for="region of orderedRegions"
      :key="region"
      v-bind="props[region]"
    />
  </div>
</template>

<script>
// Drupal's block-placement API gives regions with no visual order (see
// DruxtSite.vue's own docblock) - this is druxt-site's explicit order,
// not Drupal's. Regions not listed here still render, appended at the end.
const ORDER = [
  'pre_header',
  'header',
  'highlighted',
  'banner_top',
  'breadcrumbs',
  'page_title',
  'tabs',
  'content',
  'sidebar',
  'content_bottom',
  'bottom',
  'footer',
]

export default {
  // Not using DruxtSiteMixin ('druxt-site') - its dist file imports
  // Node's `fs` at the top level, which breaks the client bundle. Same
  // four props the mixin declares.
  props: {
    langcode: { type: String, default: undefined },
    props: { type: Object, default: () => ({}) },
    regions: { type: Array, default: () => [] },
    theme: { type: String, required: true },
  },

  computed: {
    orderedRegions() {
      const known = ORDER.filter((region) => this.regions.includes(region))
      const rest = this.regions.filter((region) => !ORDER.includes(region))
      return [...known, ...rest]
    },
  },
}
</script>

<style scoped>
.examples-bar {
  padding: var(--space-1) var(--gutter);
  font-family: var(--mono);
  font-size: 12px;
  text-align: right;
  border-top: 1px solid var(--ink);
}

.examples-bar a {
  color: var(--ink);
}
</style>

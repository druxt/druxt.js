<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-for="(entry, index) of paths"
      :key="index"
      :style="'stroke: hsl(var(--' + (entry[1] === 'sf' ? 'sf' : 'pf') + '))'"
      :d="entry[0]"
    />
  </svg>
</template>

<script>
import paths from '~/lib/module-icon-paths'

export default {
  computed: {
    /** This module's [d, tone] pairs from the shared geometry. */
    paths: () => paths.blocks,
  },
}
</script>

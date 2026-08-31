<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      v-for="d of paths"
      :key="d"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      :d="d"
    />
  </svg>
</template>

<script>
import paths from './paths'

export default {
  computed: {
    /** This section's path data from the shared geometry. */
    paths: () => paths.howTo,
  },
}
</script>

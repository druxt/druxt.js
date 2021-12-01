<template>
  <details v-if="$nuxt.context.isDev">
    <summary v-text="title" />
    <slot />
  </details>

  <div v-else />
</template>

<script>
/**
 * Debug component for use by Druxt modules.
 */
export default {
  /** */
  props: {
    /**
     * Text to display in summary.
     *
     * @type {string}
     */
    summary: {
      type: String,
      default: 'Debug',
    },
  },

  /** */
  computed: {
    /**
     * The invoking Druxt module component.
     *
     * @return {object}
     */
    module: ({ $parent }) =>
      $parent.$options._componentTag === "DruxtWrapper"
        ? $parent.$parent
        : $parent,

    /**
     * The computed summary title.
     *
     * @return {string}
     */
    title: ({ module, summary }) => module.$options._componentTag
      ? `[${module.$options._componentTag}] ${summary}`
      : summary,
  },
};
</script>

<style scoped>
details {
  border: 2px dashed lightgrey;
  margin: 0.5rem 0;
  padding: 1rem;
}

details[open] > summary {
  margin-bottom: 1rem;
}
</style>

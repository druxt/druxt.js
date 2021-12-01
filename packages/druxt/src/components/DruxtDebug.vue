<template>
  <details v-if="$nuxt.context.isDev">
    <summary v-text="title" />
    <pre v-if="json"><!--
      --><code>{{ JSON.stringify(json, null, '  ') }}</code><!--
    --></pre>
    <slot />
  </details>

  <div v-else />
</template>

<script>
/**
 * Renders Debug data only when Nuxt is in development mode.
 *
 * @example @lang vue
 * <DruxtDebug :json="entity" />
 */
export default {
  /** */
  props: {
    /**
     * JSON data to format for readability.
     *
     * @type {*}
     * @example @lang vue
     * <DruxtDebug :json="{ data: [{ one: true, two: false }] }" />
     */
    json: {
      type: [Array, Boolean, Object, Number, String],
      default: undefined
    },

    /**
     * Text to use for debug summary.
     *
     * @type {string}
     * @example @lang vue
     * <DruxtDebug summary="Foo bar" />
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

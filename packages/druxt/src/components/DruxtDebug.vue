<template>
  <details
    v-if="$nuxt.context.isDev"
    title="Expand for details"
  >
    <summary v-text="title" />
    <pre v-if="json"><!--
      --><code>{{ JSON.stringify(json, null, '  ') }}</code><!--
    --></pre>
    <!-- @slot Debug content -->
    <slot />
    <small>Note: This message is only visible when development mode is enabled.</small>
  </details>

  <div v-else />
</template>

<script>
/**
 * The DruxtDebug component can be used to render debug information that is
 * visible only when Nuxt is run in development mode.
 *
 * You can render your debug information through the default slot, or via the
 * **json** prop to format your data, or a combination of the two.
 *
 * @example @lang vue
 * <DruxtDebug :json="entity">Debug information</DruxtDebug>
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

details > summary {
  cursor: pointer;
  font-weight: 600;
}

details > summary::after {
  content: '(expand)';
  font-size: 0.75rem;
  color: blue;
  vertical-align: super;
  text-decoration: underline;
  margin-left: 0.25rem;
}

details[open] > summary {
  margin-bottom: 1rem;
}

details[open] > summary::after {
  content: ''
}

details small:last-of-type {
  display: block;
  margin-top: 2rem;
}
</style>

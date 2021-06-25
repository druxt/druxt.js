<template>
  <component
    :is="wrapper.component"
    v-bind="wrapper.props"
  >
    <!-- Label: Above -->
    <div v-if="$scopedSlots['label-above']">
      <slot name="label-above" />
    </div>

    <!-- Label: Inline -->
    <slot
      v-if="$scopedSlots['label-inline']"
      name="label-inline"
    />

    <!-- Items -->
    <!-- eslint-disable vue/no-v-html -->
    <span
      v-for="(item, key) of items"
      :key="key"
      v-html="format(item)"
    />
    <!-- eslint-enable vue/no-v-html -->
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

/**
 * Text Default field.
 * @deprecated
 */
export default {
  name: 'DruxtFieldTextDefault',

  /**
   * Vue.js Mixins.
   *
   * @see {@link ../mixins/field|DruxtFieldMixin}
   * @see {@link https://vuejs.org/v2/guide/mixins.html}
   */
  mixins: [DruxtFieldMixin],

  methods: {
    /**
     * Formats the item output.
     *
     * @param {object} item - The field item.
     *
     * @return {string}
     */
    format: (item) => item.processed
  }
}
</script>

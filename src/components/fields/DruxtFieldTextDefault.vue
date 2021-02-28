<template>
  <component
    :is="wrapper.component"
    v-bind="wrapper.props"
  >
    <!-- Label: Above -->
    <div v-if="$slots['label-above']">
      <slot name="label-above" />
    </div>

    <!-- Label: Inline -->
    <slot
      v-if="$slots['label-inline']"
      name="label-inline"
    />

    <!-- Items -->
    <span
      v-for="(item, key) of items"
      :key="key"
      v-html="format(item)"
    />
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

/**
 * Text Default field.
 *
 * _This component is intended to be rendered by the `<druxt-field />` component._
 *
 * @see {@link DruxtField}
 *
 * @example
 * <druxt-field
 *   :data="{
 *     format: 'basic_html',
 *     processed: '<p><strong>Umami Magazine &amp; Umami Publications</strong> is a fictional magazine and publisher for illustrative purposes only.</p>',
 *     value: '<strong>Umami Magazine & Umami Publications</strong> is a fictional magazine and publisher for illustrative purposes only.'
 *   }"
 *   :schema="{
 *     id: 'body',
 *     type: 'text_default'
 *   }"
 * />
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

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
    <ul>
      <li
        v-for="(item, key) of items"
        :key="key"
      >
        {{ item }}
      </li>
    </ul>
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

/**
 * List Default field.
 *
 * _This component is intended to be rendered by the `<DruxtField />` component._
 *
 * @see {@link DruxtField}
 *
 * @example
 * <DruxtField
 *   data="easy"
 *   :schema="{
 *     id: 'field_difficulty',
 *     type: 'list_default'
 *   }"
 * />
 *
 * @todo Add a multi-value example to List Default field.
 * @todo Make List Default list elements customisable.
 */
export default {
  name: 'DruxtFieldListDefault',

  /**
   * Vue.js Mixins.
   *
   * @see {@link ../mixins/field|DruxtFieldMixin}
   * @see {@link https://vuejs.org/v2/guide/mixins.html}
   */
  mixins: [DruxtFieldMixin]
}
</script>

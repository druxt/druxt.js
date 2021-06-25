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
    <p
      v-for="(item, key) of items"
      :key="key"
    >
      {{ item }}
    </p>
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

/**
 * Datetime Default field.
 *
 * _This component is intended to be rendered by the `<DruxtField />` component._
 *
 * @see {@link DruxtField}
 *
 * @todo Add an example to Datetime Default field.
 */
export default {
  name: 'DruxtFieldDatetimeDefault',

  /**
   * Vue.js Mixins.
   *
   * @see {@link ../mixins/field|DruxtFieldMixin}
   * @see {@link https://vuejs.org/v2/guide/mixins.html}
   */
  mixins: [DruxtFieldMixin]
}
</script>

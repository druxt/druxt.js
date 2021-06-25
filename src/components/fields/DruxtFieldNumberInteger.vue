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
    <span
      v-for="(item, key) of items"
      :key="key"
    >
      <span
        v-if="prefix"
        class="prefix"
      >{{ prefix }}</span>
      {{ item }}
      <span
        v-if="suffix"
        class="suffix"
      >{{ suffix }}</span>
    </span>
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

/**
 * Number Integer field.
 *
 * _This component is intended to be rendered by the `<DruxtField />` component._
 *
 * @see {@link DruxtField}
 *
 * @example
 * <DruxtField
 *   data="5"
 *   :schema="{
 *     id: 'field_preparation_time',
 *     settings: {
 *       config: {
 *         prefix: '',
 *         suffix: ' minutes'
 *       },
 *       display: {
 *         prefix_suffix: true
 *       }
 *     },
 *     type: 'number_integer'
 *   }"
 * />
 */
export default {
  name: 'DruxtFieldNumberInteger',

  /**
   * Vue.js Mixins.
   *
   * @see {@link ../mixins/field|DruxtFieldMixin}
   * @see {@link https://vuejs.org/v2/guide/mixins.html}
   */
  mixins: [DruxtFieldMixin],

  /**
   * Vue.js Computed properties.
   */
  computed: {
    prefix() {
      if (!this.schema.settings.display.prefix_suffix || !this.schema.settings.config.prefix) return false

      return this.schema.settings.config.prefix
    },

    suffix() {
      if (!this.schema.settings.display.prefix_suffix || !this.schema.settings.config.suffix) return false

      return this.schema.settings.config.suffix
    }
  }
}
</script>

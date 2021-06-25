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
    <DruxtEntity
      v-for="item of items"
      :key="item.uuid"
      v-bind="{ ...item, ...props }"
    />
  </component>
</template>

<script>
import DruxtEntity from '../../components/DruxtEntity.vue'
import { DruxtFieldMixin } from '../../mixins/field'

/**
 * Entity Reference Entity View field.
 *
 * - Renders the reference entity with the `<druxt-entity />` component.
 *
 * _This component is intended to be rendered by the `<DruxtField />` component._
 *
 * @see {@link DruxtEntity}
 * @see {@link DruxtField}
 *
 * @example @lang vue
 * <DruxtField
 *   :data="{
 *     data: {
 *       id: '88d46b5c-07c8-4d80-8f4d-e45ff2639d56',
 *       type: 'media--image'
 *     }
 *   }"
 *   :schema="{
 *     id: 'field_media_image',
 *     type: 'entity_reference_entity_view',
 *     settings: {
 *       display: {
 *         link: false,
 *         view_mode: 'medium_8_7'
 *       }
 *     }
 *   }"
 * />
 */
export default {
  name: 'DruxtFieldEntityReferenceEntityView',

  components: { DruxtEntity },

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
    /**
     * Display mode for referenced entity.
     * @type {string}
     * @default default
     */
    mode() {
      return ((this.schema.settings || {}).display || {}).view_mode || 'default'
    },

    /**
     * Properties to bind to DruxtEntity component.
     * @type {object}
     */
    props() {
      return {
        mode: this.mode,
        wrapper: this.inner,
        ...this.$attrs
      }
    }
  }
}
</script>

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
    <druxt-entity
      v-for="item of items"
      :key="item.uuid"
      v-bind="{ ...item, mode, wrapper: inner }"
    />
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

/**
 * Entity Reference Entity View field.
 *
 * - Renders the reference entity with the `<druxt-entity />` component.
 *
 * _This component is intended to be rendered by the `<druxt-field />` component._
 *
 * @see {@link DruxtEntity}
 * @see {@link DruxtField}
 *
 * @example @lang vue
 * <druxt-field
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
     * Display mode for referenced entity .
     * @type {string}
     * @default default
     */
    mode() {
      return 'default'
    }
  }
}
</script>

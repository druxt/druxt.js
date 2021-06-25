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
 * @deprecated
 */
export default {
  name: 'DruxtFieldEntityReferenceEntityView',

  components: { DruxtEntity },

  mixins: [DruxtFieldMixin],

  /** */
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

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
import { DruxtFieldMixin } from 'druxt-entity'

/**
 * Entity Reference Entity View field.
 * @deprecated in druxt-entity:0.16.0 and is removed from druxt-entity:2.0.0.
 *   Use a field wrapper component resolved by the component suggestion system instead.
 * @see https://druxtjs.org/modules/entity/deprecations
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
    },
  },

  mounted() {
    console.warn(`[druxt-entity] The ${this.$options._componentTag} component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html`)
  },
}
</script>

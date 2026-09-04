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
import { DruxtFieldMixin } from 'druxt-entity'

/**
 * Renders an integer field's values with the configured prefix and suffix.
 * @deprecated in druxt-entity:0.16.0 and is removed from druxt-entity:2.0.0.
 *   Use a field wrapper component resolved by the component suggestion system instead.
 * @see https://druxtjs.org/modules/entity/deprecations
 */
export default {
  name: 'DruxtFieldNumberInteger',

  mixins: [DruxtFieldMixin],

  /** */
  computed: {
    /**
     * The text to render before each value, if enabled by the field display settings.
     *
     * @type {boolean|string}
     * @default false
     */
    prefix() {
      if (!this.schema.settings.display.prefix_suffix || !this.schema.settings.config.prefix) return false

      return this.schema.settings.config.prefix
    },

    /**
     * The text to render after each value, if enabled by the field display settings.
     *
     * @type {boolean|string}
     * @default false
     */
    suffix() {
      if (!this.schema.settings.display.prefix_suffix || !this.schema.settings.config.suffix) return false

      return this.schema.settings.config.suffix
    }
  },

  mounted() {
    console.warn(`[druxt-entity] The ${this.$options._componentTag} component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html`)
  },
}
</script>

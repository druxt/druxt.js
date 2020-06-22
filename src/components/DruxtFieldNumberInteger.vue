<template>
  <component :is="wrapper.component" v-bind="wrapper.props">
    <!-- Label: Above -->
    <div v-if="$slots['label-above']">
      <slot #label-above />
    </div>

    <!-- Label: Inline -->
    <slot
      v-if="$slots['label-inline']"
      #label-inline
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
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldNumberInteger',

  mixins: [DruxtFieldMixin],

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

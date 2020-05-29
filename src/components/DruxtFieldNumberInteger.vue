<template>
  <div>
    <span
      v-for="(item, key) of items"
      :key="key"
    >
      <span v-if="schema.settings.display.prefix_suffix && schema.settings.config.prefix" class="prefix">{{  schema.settings.config.prefix }}</span>
      {{ item }}
      <span v-if="schema.settings.display.prefix_suffix && schema.settings.config.suffix" class="suffix">{{  schema.settings.config.suffix }}</span>
    </span>
  </div>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldNumberInteger',

  mixins: [DruxtFieldMixin]
}
</script>

<template>
  <div>
    <div
      v-for="(item, key) of items"
      :key="key"
      v-html="item"
    />
  </div>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldBasicString',

  mixins: [DruxtFieldMixin],
}
</script>

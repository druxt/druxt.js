<template>
  <ul>
    <li
      v-for="(item, key) of items"
      :key="key"
    >
      {{ item }}
    </li>
  </ul>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldListDefault',

  mixins: [DruxtFieldMixin],
}
</script>

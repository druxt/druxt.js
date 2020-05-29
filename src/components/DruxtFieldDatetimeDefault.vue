<template>
  <div>
    <p
      v-for="(item, key) of items"
      :key="key"
    >
      {{ item }}
    </p>
  </div>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldDatetimeDefault',

  mixins: [DruxtFieldMixin]
}
</script>

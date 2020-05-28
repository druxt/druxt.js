<template>
  <div>
    <span v-for="(item, key) of items" :key="key" v-html="item.processed" />
  </div>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

export default {
  name: 'DruxtFieldTextDefault',

  mixins: [DruxtFieldMixin]
}
</script>

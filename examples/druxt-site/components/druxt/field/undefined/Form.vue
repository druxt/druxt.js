<template>
  <div>
    <label><strong>{{ $parent.label.text }}:</strong><br /></label>
    <input
      v-model="model"
      size="60"
      type="text"
    ></input>
  </div>
</template>

<script>
import { DruxtFieldMixin } from 'druxt-entity'
export default {
  mixins: [DruxtFieldMixin],
}
</script>

<template>
  <v-card class="pa-2" outlined>
    <h2>{{ entity.attributes.title }}</h2>
    <slot />
  </v-card>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'
export default {
  mixins: [DruxtEntityMixin]
}
</script>

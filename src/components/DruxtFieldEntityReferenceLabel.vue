<template>
  <div v-if="entity">{{ entity.attributes.name }}</div>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'
import { DruxtRouterEntityMixin } from 'druxt-router'

export default {
  name: 'DruxtFieldEntityReferenceLabel',
  mixins: [DruxtFieldMixin, DruxtRouterEntityMixin]
}
</script>

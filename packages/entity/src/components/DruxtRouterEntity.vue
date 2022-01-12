<template>
  <DruxtEntity
    v-bind="route.props"
    mode="full"
  />
</template>

<script>
import { DruxtRouterMixin } from 'druxt-router'

export default {
  mixins: [DruxtRouterMixin],
}
</script>

<template>
  <DruxtView v-bind="route.props" />
</template>

<script>
import { DruxtRouterMixin } from 'druxt-router/dist/mixins/index.mjs'

export default {
  mixins: [DruxtRouterMixin],
}
</script>

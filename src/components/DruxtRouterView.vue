<template>
  <DruxtView v-bind="route.props" />
</template>

<script>
import { DruxtRouterMixin } from 'druxt-router'

export default {
  mixins: [DruxtRouterMixin],
}
</script>

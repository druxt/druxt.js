<template>
  <!-- Local tasks point at Drupal admin routes (/node/X/edit) this app never exposes. -->
  <span />
</template>

<script>
import { DruxtBlocksBlockMixin } from 'druxt-blocks'

export default {
  mixins: [DruxtBlocksBlockMixin],
}
</script>

<template>
  <!-- Drupal's session-flash messages have no JSON:API equivalent to read from a decoupled frontend. -->
  <span />
</template>

<script>
import { DruxtBlocksBlockMixin } from 'druxt-blocks'

export default {
  mixins: [DruxtBlocksBlockMixin],
}
</script>

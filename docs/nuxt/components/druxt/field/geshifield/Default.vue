<template>
  <highlightjs
    :code="model.sourcecode"
    :language="model.language"
  />
</template>

<script>
import 'highlight.js/styles/darcula.css'

import { DruxtFieldMixin } from 'druxt-entity'

export default {
  mixins: [DruxtFieldMixin]
}
</script>

<style>
pre code.hljs {
  @apply rounded-xl mt-2 mb-8;
}
</style>

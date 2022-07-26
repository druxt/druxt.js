<template>
  <highlightjs
    :code="model.sourcecode"
    :language="model.language"
  />
</template>

<script>
import Vue from 'vue'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import hljsVuePlugin from "@highlightjs/vue-plugin"
import 'highlight.js/styles/darcula.css'

import { DruxtFieldMixin } from 'druxt-entity'

hljs.registerLanguage('javascript', javascript)
Vue.use(hljsVuePlugin)

export default {
  mixins: [DruxtFieldMixin]
}
</script>

<style>
pre code.hljs {
  @apply rounded-xl mt-2 mb-8;
}
</style>

import Vue from 'vue'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import hljsVuePlugin from "@highlightjs/vue-plugin"

hljs.registerLanguage('javascript', javascript)
Vue.use(hljsVuePlugin)

/* global __BASE_URL__ */
import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'

import { DruxtClient, DruxtStore } from 'druxt'

import { fetchMixin } from './fetchMixin'
import App from './App.vue'
import Planner from './pages/Planner.vue'
import NotFound from './pages/NotFound.vue'
import plan from './store/plan'

import './assets/css/main.css'

Vue.use(Vuex)
Vue.use(VueRouter)

// Nuxt's fetch-lifecycle replacement - see fetchMixin.js for why this is
// the one piece of glue code that has no framework-agnostic equivalent
// already built into druxt.js. Still needed even though no Druxt UI
// component class is used below: Planner.vue's own `async fetch()` hook
// relies on it too, since fetchMixin is a global Vue.mixin(), not
// Druxt-specific.
Vue.mixin(fetchMixin)

const baseUrl = __BASE_URL__

/**
 * Meal Planner only ever calls `druxt/getCollection` (a plain Vuex action on
 * the base `druxt` store module) and renders the result as plain HTML - it
 * never instantiates `DruxtEntity`, `DruxtMenu`, `DruxtView`, or
 * `DruxtRouter`. That means none of `druxt-router`/`druxt-menu`/
 * `druxt-breadcrumb`/`druxt-views`/`druxt-entity`/`druxt-schema` are actual
 * dependencies of this app (see package.json - only `druxt` itself is), and
 * none of Nuxt's per-module wiring those packages' Nuxt modules would
 * normally do (settings, `$nuxt.context` stubs, store.app) is needed
 * either. This is the app's real footprint, not a partial port - a tool
 * that doesn't route or browse generically doesn't need to wire up the
 * modules that do.
 */
const druxt = new DruxtClient(baseUrl, { proxy: { api: true } })

// With `proxy.api`, DruxtClient leaves axios's baseURL undefined and builds
// langcode-prefixed JSON:API URLs *relative* (`en/jsonapi`), expecting the
// host framework to anchor them. Nuxt does this via @nuxtjs/axios; without
// Nuxt, it's set by hand so requests resolve against the app origin, not
// the current page path.
druxt.axios.defaults.baseURL = '/'

// Available as this.$druxt in every component, matching Nuxt's inject()
// name.
Vue.prototype.$druxt = druxt

const store = new Vuex.Store({
  modules: { plan },
})
store.$druxt = druxt
DruxtStore({ store })

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Planner },
    { path: '*', component: NotFound },
  ],
})

new Vue({
  el: '#app',
  store,
  router,
  render: (h) => h(App),
})

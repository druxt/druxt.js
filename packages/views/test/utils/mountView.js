// Mounts a real DruxtView, with the real filters components and a real store,
// against the mock in test/drupal.js. DruxtEntity and the pager are stubbed:
// rendering results and pager links is not what these tests are about.
import { createLocalVue, mount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import DruxtWrapper from '../../../druxt/src/components/DruxtWrapper.vue'
import { DruxtViewsStore } from '../../src'
import DruxtView from '../../src/components/DruxtView.vue'
import DruxtViewsFilter from '../../src/components/DruxtViewsFilter.vue'
import DruxtViewsFilters from '../../src/components/DruxtViewsFilters.vue'

const { baseUrl, drupal } = require('../../../../test/drupal')

// The path every recipes page_1 request goes to, with or without a langcode.
const resultsPath = /\/jsonapi\/views\/recipes\/page_1$/

// A stand-in for Nuxt 2's fetch, which this harness has no Nuxt to give it.
// It reproduces the one behaviour these tests depend on: $fetch() while a
// fetch runs returns the running one rather than starting another, as
// Nuxt 2's fetch.client.js does. Nuxt calls fetch() before mount on the
// client, so this does too.
const inFlight = new Set()

const NuxtFetch = {
  beforeCreate() {
    if (!this.$options.fetch) return
    this.$fetchState = Vue.observable({ pending: false, error: null })
    this.$fetch = () => {
      if (!this._fetchPromise) {
        this.$fetchState.pending = true
        this._fetchPromise = Promise.resolve()
          .then(() => this.$options.fetch.call(this))
          .catch((err) => { this.$fetchState.error = err })
          .then(() => {
            this.$fetchState.pending = false
            inFlight.delete(this._fetchPromise)
            delete this._fetchPromise
          })
        inFlight.add(this._fetchPromise)
      }
      return this._fetchPromise
    }
  },

  beforeMount() {
    if (this.$options.fetch) this.$fetch()
  }
}

/**
 * Mounts a parent that renders DruxtView with the given props.
 *
 * @param {object} options - The mount options.
 * @param {object} options.propsData - DruxtView's props.
 * @param {object} [options.query] - The starting $route.query.
 * @param {object} [options.components] - Wrapper components to register globally, by name.
 * @param {object} [options.parent] - A parent component to mount instead of the default, given `props` and `onInput`.
 * @return {Promise<object>} `wrapper` (the DruxtView), `root`, `requests`, `inputs`, `setQuery` and `flush`.
 */
export const mountView = async ({ propsData, query = {}, components = {}, parent } = {}) => {
  const localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.mixin(NuxtFetch)
  for (const component of [DruxtView, DruxtViewsFilter, DruxtViewsFilters, DruxtWrapper]) {
    localVue.component(component.name, component)
  }
  for (const [name, component] of Object.entries(components)) {
    localVue.component(name, component)
  }

  const store = new Vuex.Store()
  DruxtStore({ store })
  store.$druxt = new DruxtClient(baseUrl)
  DruxtViewsStore({ store })
  store.app = { context: { error: () => {}, isStatic: false }, store }

  const $route = Vue.observable({ meta: {}, query })

  // Each payload as it was when emitted: DruxtView emits its own model object,
  // and changes it afterwards.
  const inputs = []
  const snapshot = (value) => (value === undefined ? value : JSON.parse(JSON.stringify(value)))
  const Parent = parent || {
    template: '<DruxtView v-bind="props" @input="onInput" />',
  }

  const root = mount({
    ...Parent,
    data: () => ({ ...(Parent.data ? Parent.data() : {}), props: propsData }),
    methods: { ...(Parent.methods || {}), onInput: (value) => inputs.push(snapshot(value)) },
  }, {
    localVue,
    mocks: {
      $druxt: { settings: {} },
      $nuxt: { context: { isDev: false } },
      $route,
    },
    store,
    stubs: ['DruxtDebug', 'DruxtEntity', 'DruxtViewsPager'],
  })

  // Waits until no fetch is running and Vue has rendered what they set,
  // including fetches that a watcher started on the way.
  const flush = async () => {
    do {
      await Promise.all([...inFlight])
      await localVue.nextTick()
    } while (inFlight.size)
  }

  const requests = () => drupal.requests()
    .filter(({ path }) => resultsPath.test(path))
    .map(({ search, status }) => ({ search: search.replace(/^\?/, ''), status }))

  const setQuery = (to) => { $route.query = to }

  return {
    inputs,
    requests,
    root,
    setQuery,
    flush,
    get wrapper() { return root.findComponent({ name: 'DruxtView' }) },
  }
}

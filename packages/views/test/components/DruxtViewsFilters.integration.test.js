import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vue from 'vue'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import DruxtWrapper from '../../../druxt/src/components/DruxtWrapper.vue'
import { DruxtViewsStore } from '../../src'
import DruxtView from '../../src/components/DruxtView.vue'
import DruxtViewsFilter from '../../src/components/DruxtViewsFilter.vue'
import DruxtViewsFilters from '../../src/components/DruxtViewsFilters.vue'
import { DruxtViewsFilterMixin } from '../../src/mixins/filter'
import { DruxtViewsFiltersMixin } from '../../src/mixins/filters'

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

// Mounts a real DruxtView, with the real filters components and a real store,
// against the mock in test/drupal.js. DruxtEntity and the pager are stubbed:
// rendering results and pager links is not what these tests are about.
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
const mountView = async ({ propsData, query = {}, components = {}, parent } = {}) => {
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

// A site's own wrapper for the `basic` exposed form, which applies the filters
// when its button is pressed rather than as they change.
const DruxtViewsFiltersBasic = {
  name: 'DruxtViewsFiltersBasic',
  mixins: [DruxtViewsFiltersMixin],
  render(h) {
    return h('form', { on: { submit: (event) => event.preventDefault() } }, [
      this.$scopedSlots.difficulty && this.$scopedSlots.difficulty(),
      h('button', {
        attrs: { 'data-test': 'apply', type: 'button' },
        on: { click: () => this.$emit('input', this.value) },
      }, this.options.submit_button),
    ])
  },
}

// A site's own wrapper for the Difficulty filter, as a select.
const DruxtViewsFilterFieldDifficultyValue = {
  name: 'DruxtViewsFilterFieldDifficultyValue',
  mixins: [DruxtViewsFilterMixin],
  render(h) {
    const options = [['', '- Any -'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']]
    return h('label', [
      this.filter.expose.label,
      h('select', {
        attrs: { 'data-test': 'difficulty' },
        domProps: { value: this.value || '' },
        on: { change: (event) => this.$emit('input', event.target.value || undefined) },
      }, options.map(([value, label]) => h('option', { attrs: { value } }, label))),
    ])
  },
}

// The recipes view, as Umami lists it at /recipes. The views-recipes-difficulty
// overlay exposes its Difficulty field as a filter and lists four to a page.
const recipes = { displayId: 'page_1', viewId: 'recipes' }

// The query DruxtView sends for each Difficulty value, as qs writes it.
const difficulty = (value) => `views-filter${encodeURIComponent('[difficulty]')}=${value}`
const easy = difficulty('easy')
const medium = difficulty('medium')

// Umami's recipes by node ID, newest first: nodes 3, 4, 5 and 9 are easy, the
// rest medium.
const nodeIds = (wrapper) => wrapper.vm.results.map((result) => result.attributes.drupal_internal__nid)
const allFirstPage = [10, 9, 8, 7]
const easyRecipes = [9, 5, 4, 3]
const mediumFirstPage = [10, 8, 7, 6]

// Sets a filter as the filter's wrapper would: DruxtViewsFilter emits `input`,
// and DruxtViewsFilters takes it from there. 'through a select' drives a real
// wrapper's select instead, to show the two agree.
const setFilter = (wrapper, value) => wrapper
  .findComponent({ name: 'DruxtViewsFilter' })
  .vm.$emit('input', value)

describe('DruxtViewsFilters, mounted in a DruxtView against the mock', () => {
  test('renders recipes page_1 with no filter, from one request', async () => {
    const { wrapper, requests, flush } = await mountView({ propsData: recipes })
    await flush()

    expect(requests()).toStrictEqual([{ search: '', status: 200 }])
    expect(nodeIds(wrapper)).toStrictEqual(allFirstPage)
  })

  describe('auto apply, with the default DruxtWrapper', () => {
    test('one request per filter change', async () => {
      const { wrapper, requests, flush } = await mountView({ propsData: recipes })
      await flush()

      setFilter(wrapper, 'easy')
      await flush()

      expect(requests().slice(1)).toStrictEqual([{ search: easy, status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual(easyRecipes)
    })

    test('through a select', async () => {
      const { wrapper, requests, flush } = await mountView({
        propsData: recipes,
        components: { DruxtViewsFilterFieldDifficultyValue },
      })
      await flush()

      await wrapper.find('[data-test=difficulty]').setValue('easy')
      await flush()

      expect(requests().slice(1)).toStrictEqual([{ search: easy, status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual(easyRecipes)
    })

    test('back to any', async () => {
      const { wrapper, requests, flush } = await mountView({ propsData: recipes })
      await flush()
      setFilter(wrapper, 'easy')
      await flush()
      expect(nodeIds(wrapper)).toStrictEqual(easyRecipes)
      const before = requests()

      setFilter(wrapper, undefined)
      await flush()

      // The unfiltered first page is still in the store from the first request.
      expect(requests()).toStrictEqual(before)
      expect(nodeIds(wrapper)).toStrictEqual(allFirstPage)
    })
  })

  describe('manual apply, with a DruxtViewsFiltersBasic wrapper', () => {
    const components = { DruxtViewsFiltersBasic }

    test('no request until Apply', async () => {
      const { wrapper, requests, flush } = await mountView({ propsData: recipes, components })
      await flush()

      setFilter(wrapper, 'medium')
      await flush()

      expect(requests()).toStrictEqual([{ search: '', status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual(allFirstPage)
    })

    test('Apply sends one request', async () => {
      const { wrapper, requests, flush } = await mountView({ propsData: recipes, components })
      await flush()
      setFilter(wrapper, 'medium')
      await flush()

      await wrapper.find('[data-test=apply]').trigger('click')
      await flush()

      expect(requests().slice(1)).toStrictEqual([{ search: medium, status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual(mediumFirstPage)
    })
  })

  describe('filters from the URL', () => {
    // /recipes?filter[difficulty]=easy, as Vue Router parses it: flat, for
    // DruxtView to nest.
    const fromUrl = { 'filter[difficulty]': 'easy' }

    test('the first request carries the filter, and the parent sees no input', async () => {
      const { wrapper, requests, inputs, flush } = await mountView({
        propsData: recipes,
        query: fromUrl,
      })
      await flush()

      expect(requests()).toStrictEqual([{ search: easy, status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual(easyRecipes)
      expect(inputs).toStrictEqual([])
    })

    test('clearing the URL sends one request with no filter', async () => {
      const { wrapper, requests, inputs, flush, setQuery } = await mountView({
        propsData: recipes,
        query: fromUrl,
      })
      await flush()
      expect(requests()).toStrictEqual([{ search: easy, status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual(easyRecipes)

      setQuery({})
      await flush()

      expect(requests().slice(1)).toStrictEqual([{ search: '', status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual(allFirstPage)
      // DruxtView's own model is reset, and it emits it to its parent.
      expect(inputs).toStrictEqual([{ filter: {}, page: null, sort: null }])
      // And no null comes back up from DruxtViewsFilter.
      expect(wrapper.vm.model.filter).toStrictEqual({})
    })
  })

  // A filter change goes back to the first page, as a Drupal-rendered view does
  // when its exposed form is submitted, with one request.
  test('a filter change on page 2 returns to the first page', async () => {
    const { wrapper, requests, flush } = await mountView({ propsData: recipes, query: { page: '1' } })
    await flush()
    expect(requests()).toStrictEqual([{ search: 'page=1', status: 200 }])

    setFilter(wrapper, 'easy')
    await flush()

    expect(requests().slice(1)).toStrictEqual([{ search: easy, status: 200 }])
    expect(wrapper.vm.model.page).toBeNull()
    expect(nodeIds(wrapper)).toStrictEqual(easyRecipes)
  })

  test('a parent binding DruxtViewsFilters with v-model', async () => {
    const view = drupal.handle('GET', `/en/jsonapi/view/view?filter${encodeURIComponent('[drupal_internal__id]')}=recipes`)
    const filter = view.body.data[0].attributes.display.default.display_options.filters.field_difficulty_value

    const { root, inputs, flush } = await mountView({
      propsData: { filters: [filter] },
      parent: {
        template: '<DruxtViewsFilters v-model="model" v-bind="props" @input="onInput" />',
        data: () => ({ model: {} }),
      },
      components: { DruxtViewsFilterFieldDifficultyValue },
    })
    await flush()

    await root.setData({ model: { difficulty: 'easy' } })
    await flush()

    // The parent set the value, so it does not hear it back.
    expect(inputs).toStrictEqual([])
    // The value reached the control of the filter it belongs to.
    expect(root.find('[data-test=difficulty]').element.value).toBe('easy')
  })
})

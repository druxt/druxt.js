import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import DruxtWrapper from '../../../druxt/src/components/DruxtWrapper.vue'
import DruxtEntity from '../../../entity/src/components/DruxtEntity.vue'
import { DruxtSchemaStore } from '../../../schema/src'
import { DruxtViewsStore } from '../../src'
import DruxtView from '../../src/components/DruxtView.vue'

const { baseUrl, drupal } = require('../../../../test/drupal')
const { NuxtFetch, settle } = require('../../../../test/nuxt-fetch')

// A mounted DruxtView and its rows follow the store (#1019), against the
// mock's recipes view, with real DruxtEntity rows.

const resultsPath = /\/jsonapi\/views\/recipes\/page_1$/
const resultsRequests = () => drupal.requests().filter(({ path }) => resultsPath.test(path)).length

// The store mountView() made last, for a test that flushes it mid-request.
let lastStore

const mountView = async ({ settings = {} } = {}) => {
  const localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.mixin(NuxtFetch)
  for (const component of [DruxtView, DruxtWrapper, DruxtEntity]) {
    localVue.component(component.name, component)
  }

  const store = new Vuex.Store()
  DruxtStore({ store })
  store.$druxt = new DruxtClient(baseUrl)
  DruxtViewsStore({ store })
  DruxtSchemaStore({ store })
  // The rows' displays aren't among the fixtures; a row renders without one.
  store.$druxtSchema = { import: () => { throw new Error('No schema fixture') } }
  store.app = { context: { error: () => {}, isStatic: false }, store }
  lastStore = store

  const root = mount({
    data: () => ({ langcode: 'en', settings }),
    template: '<DruxtView ref="view" view-id="recipes" display-id="page_1" :langcode="langcode" :settings="settings" />',
  }, {
    localVue,
    mocks: {
      $druxt: { settings: {} },
      $nuxt: { context: { isDev: false } },
      $route: { meta: {}, query: {} },
      $router: { replace: () => Promise.resolve() },
    },
    store,
    stubs: ['DruxtDebug', 'DruxtViewsPager', 'DruxtViewsFilters', 'DruxtViewsSorts'],
  })
  await settle(localVue)

  const view = root.vm.$refs.view
  const rows = () => root.findAllComponents({ name: 'DruxtEntity' }).wrappers.map((w) => w.vm)
  return { localVue, store, root, view, rows }
}

describe('DruxtView follows the store', () => {
  test('clearCache fetches the results again', async () => {
    const { localVue, store, view, rows } = await mountView()
    const ids = rows().map((row) => row.uuid)
    expect(ids.length).toBeGreaterThan(0)
    const before = resultsRequests()

    store.dispatch('druxt/clearCache')
    await settle(localVue)

    expect(resultsRequests()).toBe(before + 1)
    expect(view.hasStoredResults).toBe(true)
    expect(rows().map((row) => row.uuid)).toStrictEqual(ids)
  })

  test('a flush of its language fetches the results again', async () => {
    const { localVue, store } = await mountView()
    const before = resultsRequests()

    store.commit('druxt/views/flushResults', { viewId: 'recipes', displayId: 'page_1', prefix: 'en' })
    await settle(localVue)
    expect(resultsRequests()).toBe(before + 1)
  })

  test('a flush of its query fetches the results again', async () => {
    const { localVue, store, view, rows } = await mountView()
    const ids = rows().map((row) => row.uuid)
    const before = resultsRequests()
    const [hash] = Object.keys(store.state['druxt/views'].results.recipes.page_1.en)

    store.commit('druxt/views/flushResults', { viewId: 'recipes', displayId: 'page_1', prefix: 'en', hash })
    await settle(localVue)
    expect(resultsRequests()).toBe(before + 1)
    expect(view.hasStoredResults).toBe(true)
    expect(rows().map((row) => row.uuid)).toStrictEqual(ids)
  })

  test('a flush while the results load fetches them again', async () => {
    const get = mockAxios.get.getMockImplementation()
    let flushed = false
    mockAxios.get.mockImplementation(async (url, config) => {
      const response = await get(url, config)
      if (!flushed && decodeURIComponent(url).includes('/jsonapi/views/recipes/page_1')) {
        flushed = true
        lastStore.commit('druxt/views/flushResults', {})
      }
      return response
    })
    let view
    try {
      ({ view } = await mountView())
    } finally {
      mockAxios.get.mockImplementation(get)
    }

    expect(flushed).toBe(true)
    expect(view.hasStoredResults).toBe(true)
  })

  test('a view that bypasses the cache fetches once per fetch', async () => {
    const { localVue, view } = await mountView({ settings: { query: { bypassCache: true } } })
    const before = resultsRequests()

    view.$fetch()
    await settle(localVue)
    expect(resultsRequests()).toBe(before + 1)
    expect(view.hasStoredResults).toBe(true)
  })

  test('a flush after switching languages and back fetches again', async () => {
    const { localVue, root, store } = await mountView()
    root.vm.langcode = 'es'
    await settle(localVue)
    root.vm.langcode = 'en'
    await settle(localVue)
    const before = resultsRequests()

    store.dispatch('druxt/clearCache')
    await settle(localVue)
    expect(resultsRequests()).toBe(before + 1)
  })

  test('a row follows a stored change', async () => {
    const { localVue, store, rows } = await mountView()
    const row = rows()[0]
    const data = JSON.parse(JSON.stringify(store.state.druxt.resources['node--recipe'][row.uuid].en.data))
    data.attributes.title = 'Saved'

    store.commit('druxt/addResource', { resource: { data }, prefix: 'en' })
    await settle(localVue)
    expect(rows()[0].model.attributes.title).toBe('Saved')
  })

  test('a language switch fetches the results once', async () => {
    const { localVue, root, view } = await mountView()
    const before = resultsRequests()
    // A second fetch is answered from the store, which counting requests misses.
    const fetches = jest.spyOn(view, '$fetch')

    root.vm.langcode = 'es'
    await settle(localVue)
    expect(fetches).toHaveBeenCalledTimes(1)
    expect(resultsRequests()).toBe(before + 1)
  })
})

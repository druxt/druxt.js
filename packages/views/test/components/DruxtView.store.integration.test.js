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
const { NuxtFetch, setFetchDelay, setHydration, settle } = require('../../../../test/nuxt-fetch')

// A mounted DruxtView and its rows follow the store (#1019), against the
// mock's recipes view, with real DruxtEntity rows.

const resultsPath = /\/jsonapi\/views\/recipes\/page_1$/
const resultsRequests = () => drupal.requests().filter(({ path }) => resultsPath.test(path)).length

// The store mountView() made last, for a test that flushes it mid-request.
let lastStore

// With `pair`, a second view of the same results sits beside the first, as
// a block elsewhere on the page shows the same view.
// With `hydrate`, the view mounts on that store with that data and doesn't
// fetch, as a server-rendered view does.
const mountView = async ({ settings = {}, pair = false, hydrate } = {}) => {
  const localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.mixin(NuxtFetch)
  for (const component of [DruxtView, DruxtWrapper, DruxtEntity]) {
    localVue.component(component.name, component)
  }

  const store = hydrate ? hydrate.store : new Vuex.Store()
  if (!hydrate) {
    DruxtStore({ store })
    store.$druxt = new DruxtClient(baseUrl)
    DruxtViewsStore({ store })
    DruxtSchemaStore({ store })
    // The rows' displays aren't among the fixtures; a row renders without one.
    store.$druxtSchema = { import: () => { throw new Error('No schema fixture') } }
    store.app = { context: { error: () => {}, isStatic: false }, store }
  }
  lastStore = store
  // The payload holds copies, never the store's own objects.
  if (hydrate) setHydration((vm) => (vm.$options.name === 'DruxtView' ? JSON.parse(JSON.stringify(hydrate.data)) : undefined))

  const root = mount({
    data: () => ({ langcode: 'en', settings }),
    template: `<div>
      <DruxtView ref="view" view-id="recipes" display-id="page_1" :langcode="langcode" :settings="settings" />
      ${pair ? '<DruxtView ref="other" view-id="recipes" display-id="page_1" :langcode="langcode" :settings="settings" />' : ''}
    </div>`,
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
  setHydration(null)

  const view = root.vm.$refs.view
  const rows = () => root.findComponent({ ref: 'view' }).findAllComponents({ name: 'DruxtEntity' }).wrappers.map((w) => w.vm)
  return { localVue, store, root, view, other: root.vm.$refs.other, rows }
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

  test('a server-rendered view fetches its results again after a flush', async () => {
    const server = await mountView()
    const { component, model, resource, view: config } = server.view.$data
    // Only the store and the data reach the browser.
    server.root.destroy()
    const { localVue, store, view, rows } = await mountView({ hydrate: { store: server.store, data: { component, model, resource, view: config } } })
    const ids = rows().map((row) => row.uuid)
    expect(ids.length).toBeGreaterThan(0)
    const before = resultsRequests()

    store.dispatch('druxt/clearCache')
    await settle(localVue)

    expect(resultsRequests()).toBeGreaterThan(before)
    expect(view.hasStoredResults).toBe(true)
    expect(rows().map((row) => row.uuid)).toStrictEqual(ids)
  })

  test('a view whose refetch Drupal refused fetches again on the next clear', async () => {
    const { localVue, store, view, rows } = await mountView()
    const ids = rows().map((row) => row.uuid)

    // After a sign-out, Drupal refuses the results.
    const get = mockAxios.get.getMockImplementation()
    mockAxios.get.mockImplementation((url, config) => {
      if (!decodeURIComponent(url).includes('/jsonapi/views/recipes/page_1')) return get(url, config)
      const err = new Error('Request failed with status code 403')
      err.response = { status: 403, statusText: 'Forbidden', data: { errors: [{ status: '403', title: 'Forbidden' }] } }
      return Promise.reject(err)
    })
    try {
      store.dispatch('druxt/clearCache')
      await settle(localVue)
    } finally {
      mockAxios.get.mockImplementation(get)
    }
    expect(view.hasStoredResults).toBe(false)

    // Signed in again, the next clear brings the results back.
    store.dispatch('druxt/clearCache')
    await settle(localVue)
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

  test('a flush while a fetch waits out its delay fetches again', async () => {
    const { localVue, store, view } = await mountView()
    const before = resultsRequests()
    const get = mockAxios.get.getMockImplementation()
    let flushed = false
    // Nuxt keeps a fetch running for at least its delay, 200 ms by default.
    // This flush comes once the results are stored, before the delay ends.
    mockAxios.get.mockImplementation(async (url, config) => {
      const response = await get(url, config)
      if (!flushed && decodeURIComponent(url).includes('/jsonapi/views/recipes/page_1')) {
        flushed = true
        setTimeout(() => lastStore.commit('druxt/views/flushResults', {}), 10)
      }
      return response
    })
    setFetchDelay(50)
    try {
      store.commit('druxt/views/flushResults', {})
      await settle(localVue)
    } finally {
      setFetchDelay(0)
      mockAxios.get.mockImplementation(get)
    }

    expect(flushed).toBe(true)
    expect(resultsRequests()).toBe(before + 2)
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

  test('two views that bypass the cache fetch once each', async () => {
    const { localVue, view, other } = await mountView({ settings: { query: { bypassCache: true } }, pair: true })
    const before = resultsRequests()

    view.$fetch()
    await settle(localVue)
    expect(resultsRequests()).toBe(before + 1)
    expect(other.resource).toBe(view.resource)
    expect(other.hasStoredResults).toBe(true)
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

import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

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

const mountView = async () => {
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

  const root = mount({
    data: () => ({ langcode: 'en' }),
    template: '<DruxtView ref="view" view-id="recipes" display-id="page_1" :langcode="langcode" />',
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

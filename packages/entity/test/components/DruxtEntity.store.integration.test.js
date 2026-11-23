import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import { DruxtSchemaStore } from '../../../schema/src'
import DruxtEntity from '../../src/components/DruxtEntity.vue'
import DruxtField from '../../src/components/DruxtField.vue'

const { baseUrl } = require('../../../../test/drupal')
const { NuxtFetch, settle } = require('../../../../test/nuxt-fetch')

// A mounted DruxtEntity follows its resource in the store (#1019), against
// the mock in test/drupal.js. The pages come from a client of their own, so
// the store under test starts empty.

const copy = (o) => JSON.parse(JSON.stringify(o))
const titleOf = (vm) => ((vm.model || {}).attributes || {}).title

// The mock has one page, which has the form schema the flip needs, and ten
// recipes, for the tests that need two entities of one type.
let pages
let recipes
beforeAll(async () => {
  const client = new DruxtClient(baseUrl)
  pages = (await client.getCollection('node--page', {}, 'en')).data
  recipes = (await client.getCollection('node--recipe', {}, 'en')).data
})

// The renders of the page's view wrapper, by entity.
let renders

// The store setup() made last, for a test that flushes it mid-request.
let lastStore

const setup = ({ fetch = true } = {}) => {
  const localVue = createLocalVue()
  localVue.use(Vuex)
  if (fetch) localVue.mixin(NuxtFetch)
  localVue.component('DruxtEntity', DruxtEntity)
  localVue.component('DruxtField', DruxtField)
  renders = {}
  const Wrapper = {
    props: ['entity', 'fields', 'value'],
    render(h) {
      renders[this.entity.id] = (renders[this.entity.id] || 0) + 1
      return h('article', [h('h2', (this.entity.attributes || {}).title)])
    },
  }
  localVue.component('DruxtEntityNodePageDefaultView', Wrapper)
  localVue.component('DruxtEntityNodeRecipeDefaultView', Wrapper)

  const store = new Vuex.Store()
  lastStore = store
  DruxtStore({ store })
  store.$druxt = new DruxtClient(baseUrl)
  DruxtSchemaStore({ store })
  store.$druxtSchema = { import: (schema) => require(`../../../../test/__fixtures__/schemas/${schema}.json`) }
  store.app = { context: { error: jest.fn(), isStatic: false }, store }

  return { localVue, store }
}

const mocks = { $druxt: { settings: {} }, $nuxt: { context: { isDev: false } }, $route: { meta: {}, query: {} } }

// Entity A, whose schema type a test can flip, and entity B beside it, as a
// teaser elsewhere on the page shows the same entity.
const mountPair = async ({ langcode = 'en', type = 'node--page' } = {}) => {
  const { localVue, store } = setup()
  const first = (type === 'node--page' ? pages : recipes)[0].id
  const root = mount({
    data: () => ({ schemaType: 'view', uuid: first, langcode, type }),
    template: `<div>
      <DruxtEntity ref="a" :type="type" :uuid="uuid" :langcode="langcode" :schema-type="schemaType" />
      <DruxtEntity ref="b" :type="type" :uuid="first" langcode="en" />
    </div>`,
    computed: { first: () => first },
  }, { localVue, store, mocks, stubs: ['DruxtDebug'] })
  await settle(localVue)
  return { localVue, store, root, a: root.vm.$refs.a, b: root.vm.$refs.b }
}

// Writes a page into the store with a title, as a save or a preview does.
const store = (s, page, title, prefix = 'en') => {
  const resource = { data: copy(page) }
  resource.data.attributes.title = title
  s.commit('druxt/addResource', { resource, prefix })
}

describe('DruxtEntity renders from the store', () => {
  afterEach(() => mockAxios.reset())

  test('a store write reaches every mounted entity', async () => {
    const { localVue, store: s, a, b } = await mountPair()
    store(s, pages[0], 'Stored')
    await settle(localVue)

    expect(titleOf(a)).toBe('Stored')
    expect(titleOf(b)).toBe('Stored')
    expect(a.dirty).toBe(false)
    expect(b.dirty).toBe(false)
  })

  test('an entity with unsaved edits keeps them', async () => {
    const { localVue, store: s, a, b } = await mountPair()
    a.model = { ...a.model, attributes: { ...a.model.attributes, title: 'Edited in A' } }
    store(s, pages[0], 'Stored')
    await settle(localVue)

    expect(titleOf(a)).toBe('Edited in A')
    expect(a.dirty).toBe(true)
    expect(titleOf(b)).toBe('Stored')
  })

  test('a widget that edits in place counts as an edit', async () => {
    const { localVue, a } = await mountPair()
    expect(a.dirty).toBe(false)
    a.model.attributes.title = 'x'
    await localVue.nextTick()

    expect(a.dirty).toBe(true)
  })

  test('the flip keeps the edits as a preview', async () => {
    const { localVue, root, a, b } = await mountPair()
    const stored = titleOf(b)

    root.vm.schemaType = 'form'
    await settle(localVue)
    a.model = { ...a.model, attributes: { ...a.model.attributes, title: 'Draft' } }

    mockAxios.get.mockClear()
    root.vm.schemaType = 'view'
    await settle(localVue)
    expect(((a.schema || {}).config || {}).schemaType).toBe('view')
    expect(titleOf(a)).toBe('Draft')
    expect(titleOf(b)).toBe(stored)
    expect(mockAxios.get).not.toHaveBeenCalled()

    root.vm.schemaType = 'form'
    await settle(localVue)
    expect(titleOf(a)).toBe('Draft')
  })

  test('an assignment equal to the store stays clean', async () => {
    const { localVue, store: s, a } = await mountPair()
    store(s, pages[0], 'Stored')
    await settle(localVue)

    // The Umami demo's drafts plugin hands each mounted entity what it just
    // wrote to the store.
    const data = s.state.druxt.resources['node--page'][pages[0].id].en.data
    a.model = { ...copy(data), included: a.model.included }
    await localVue.nextTick()
    expect(a.dirty).toBe(false)

    store(s, pages[0], 'Again')
    await settle(localVue)
    expect(titleOf(a)).toBe('Again')
  })

  test('another entity of the type loading re-renders nothing', async () => {
    const { localVue, store: s } = await mountPair({ type: 'node--recipe' })
    const before = { ...renders }
    expect(before[recipes[0].id]).toBeGreaterThan(0)

    store(s, recipes[1], 'Another recipe')
    await settle(localVue)
    expect(renders).toStrictEqual(before)
  })

  test('an entity in another language ignores a write under another prefix', async () => {
    const { localVue, store: s, root, a } = await mountPair({ langcode: 'es' })
    const before = titleOf(a)
    expect(before).toBeTruthy()

    store(s, pages[0], 'Stored in English')
    await settle(localVue)
    expect(root.vm.langcode).toBe('es')
    expect(titleOf(a)).toBe(before)
  })

  test("a uuid change drops the old entity's edits", async () => {
    const { localVue, root, a } = await mountPair({ type: 'node--recipe' })
    a.model = { ...a.model, attributes: { ...a.model.attributes, title: 'Edited' } }

    root.vm.uuid = recipes[1].id
    await settle(localVue)
    expect(a.model.id).toBe(recipes[1].id)
    expect(titleOf(a)).toBe(recipes[1].attributes.title)
    expect(a.dirty).toBe(false)
  })

  test('an entity that never fetched follows the store', async () => {
    // A server render leaves the store and the model; the client doesn't fetch.
    const { localVue, store: s } = setup({ fetch: false })
    store(s, pages[0], pages[0].attributes.title)
    const model = copy(s.state.druxt.resources['node--page'][pages[0].id].en.data)

    const wrapper = mount(DruxtEntity, {
      localVue,
      store: s,
      mocks: { ...mocks, $fetchState: { pending: false } },
      propsData: { type: 'node--page', uuid: pages[0].id, langcode: 'en' },
      data: () => ({ model }),
      stubs: ['DruxtDebug'],
    })

    store(s, pages[0], 'Stored')
    await localVue.nextTick()
    expect(titleOf(wrapper.vm)).toBe('Stored')
  })

  test("a parent's value is kept", async () => {
    const { localVue, store: s } = setup()
    const value = { ...copy(pages[0]), included: undefined }
    value.attributes.title = 'Parent'
    const root = mount({
      data: () => ({ value }),
      template: '<DruxtEntity ref="a" v-model="value" type="node--page" :uuid="id" langcode="en" />',
      computed: { id: () => pages[0].id },
    }, { localVue, store: s, mocks, stubs: ['DruxtDebug'] })
    await settle(localVue)

    store(s, pages[0], 'Stored')
    await settle(localVue)
    expect(titleOf(root.vm.$refs.a)).toBe('Parent')
    expect(root.vm.$refs.a.dirty).toBe(false)
  })

  describe('when the store empties', () => {
    const pageRequests = (id) => mockAxios.get.mock.calls.filter(([url]) => decodeURIComponent(url).includes(`/node/page/${id}`))

    test('clearCache keeps the content and fetches again', async () => {
      const { localVue, store: s, a, b } = await mountPair()
      const title = titleOf(a)
      mockAxios.get.mockClear()

      s.dispatch('druxt/clearCache')
      await localVue.nextTick()
      expect(titleOf(a)).toBe(title)

      await settle(localVue)
      expect(pageRequests(pages[0].id)).toHaveLength(1)
      expect(a.storedEntity).toBeTruthy()
      expect(titleOf(a)).toBe(title)
      expect(titleOf(b)).toBe(title)
    })

    test('a flush during a running fetch fetches after it', async () => {
      // The first answer for the page arrives just after a flush, so the store
      // drops it, as it drops anything fetched before a flush.
      const get = mockAxios.get.getMockImplementation()
      let flushed = false
      mockAxios.get.mockImplementation(async (url, config) => {
        const response = await get(url, config)
        if (!flushed && decodeURIComponent(url).includes(`/node/page/${pages[0].id}`)) {
          flushed = true
          lastStore.commit('druxt/flushResource', {})
        }
        return response
      })

      const { a } = await mountPair()
      mockAxios.get.mockImplementation(get)

      expect(flushed).toBe(true)
      expect(pageRequests(pages[0].id)).toHaveLength(2)
      expect(a.storedEntity).toBeTruthy()
    })

    test('a flush keeps unsaved edits', async () => {
      const { localVue, store: s, a, b } = await mountPair()
      const title = titleOf(b)
      a.model = { ...a.model, attributes: { ...a.model.attributes, title: 'Edited in A' } }

      s.dispatch('druxt/clearCache')
      await settle(localVue)
      expect(titleOf(a)).toBe('Edited in A')
      expect(a.dirty).toBe(true)
      expect(titleOf(b)).toBe(title)
    })
  })
})

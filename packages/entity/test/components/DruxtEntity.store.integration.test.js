import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import { DruxtSchemaStore } from '../../../schema/src'
import DruxtEntity from '../../src/components/DruxtEntity.vue'
import DruxtEntityForm from '../../src/components/DruxtEntityForm.vue'
import DruxtField from '../../src/components/DruxtField.vue'

const { baseUrl } = require('../../../../test/drupal')
const { NuxtFetch, setFetchDelay, setHydration, settle } = require('../../../../test/nuxt-fetch')

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
  localVue.mixin(NuxtFetch)
  // Without `fetch`, the components mount as on a server-rendered page: they
  // have `$fetch()` and don't call it, and the test gives them their data.
  setHydration(fetch ? null : () => ({}))
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

// Holds back the first request matching `match` until `release()`, so a test
// can act while it is pending. `hit` resolves once the request is made.
const hold = (method, match) => {
  const impl = mockAxios[method].getMockImplementation()
  let release
  let reached
  const opened = new Promise((resolve) => { release = resolve })
  const hit = new Promise((resolve) => { reached = resolve })
  mockAxios[method].mockImplementation(async (url, ...args) => {
    if (reached && match(decodeURIComponent(url))) {
      const reach = reached
      reached = null
      reach()
      await opened
    }
    return impl(url, ...args)
  })
  return { hit, release: () => { release(); mockAxios[method].mockImplementation(impl) } }
}

// The requests made for a page.
const pageRequests = (id) => mockAxios.get.mock.calls.filter(([url]) => decodeURIComponent(url).includes(`/node/page/${id}`))

// Writes a page into the store with a title, as a save or a preview does.
const store = (s, page, title, prefix = 'en') => {
  const resource = { data: copy(page) }
  resource.data.attributes.title = title
  s.commit('druxt/addResource', { resource, prefix })
}

describe('DruxtEntity renders from the store', () => {
  afterEach(() => {
    mockAxios.reset()
    setHydration(null)
  })

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

  test('a store write that changes nothing leaves the entity as it is', async () => {
    const { localVue, store: s, root, a, b } = await mountPair()
    const models = [a.model, b.model]
    const before = { ...renders }
    const text = root.text()

    // As another component's fetch of the same entity stores it again.
    store(s, pages[0], pages[0].attributes.title)
    await settle(localVue)

    expect(a.model).toBe(models[0])
    expect(b.model).toBe(models[1])
    expect(renders).toStrictEqual(before)
    expect(root.text()).toBe(text)
  })

  test('a store write renders each entity that shows it once, and what it renders', async () => {
    const { localVue, store: s, root } = await mountPair()
    const before = renders[pages[0].id]

    store(s, pages[0], 'Stored')
    await settle(localVue)

    // Both entities show the page.
    expect(renders[pages[0].id] - before).toBe(2)
    expect(root.findAll('h2').wrappers.map((h2) => h2.text())).toStrictEqual(['Stored', 'Stored'])
  })

  test('an entity copies what it fetched once, and tells its parent once', async () => {
    // Before setup() registers the component, which copies its methods.
    const copies = jest.spyOn(DruxtEntity.methods, 'setModelFromStore')
    const { localVue, store: s } = setup()
    const input = jest.fn()
    try {
      // No wrapper of the site's own, as with a `#default` template.
      const root = mount({
        template: '<div><DruxtEntity ref="a" type="node--page" :uuid="uuid" langcode="en" :wrapper="false" @input="input" /></div>',
        data: () => ({ uuid: pages[0].id }),
        methods: { input },
      }, { localVue, store: s, mocks, stubs: ['DruxtDebug'] })
      await settle(localVue)
      expect(titleOf(root.vm.$refs.a)).toBe(pages[0].attributes.title)
      expect(copies).toHaveBeenCalledTimes(1)
      expect(input).toHaveBeenCalledTimes(1)

      // Stored again unchanged, the parent hears nothing.
      store(s, pages[0], pages[0].attributes.title)
      await settle(localVue)
      expect(input).toHaveBeenCalledTimes(1)
    } finally {
      copies.mockRestore()
    }
  })

  test('dirty read before the entity loads still sees a later edit', async () => {
    const { localVue, store: s } = setup()
    const get = hold('get', (url) => url.includes(`/node/page/${pages[0].id}`))
    let wrapper
    try {
      wrapper = mount(DruxtEntity, { localVue, store: s, mocks, propsData: { type: 'node--page', uuid: pages[0].id, langcode: 'en' }, stubs: ['DruxtDebug'] })
      await get.hit
      // As a page's "unsaved changes" notice reads it while the entity loads.
      expect(wrapper.vm.dirty).toBe(false)
    } finally {
      get.release()
    }
    await settle(localVue)
    expect(wrapper.vm.dirty).toBe(false)

    wrapper.vm.model.attributes.title = 'Edited'
    expect(wrapper.vm.dirty).toBe(true)
  })

  test('an entity whose parent stops passing a value follows the store from then on', async () => {
    const { localVue, store: s } = setup()
    const value = { ...copy(pages[0]), included: undefined }
    value.attributes.title = 'Parent'
    const root = mount({
      data: () => ({ value }),
      template: '<DruxtEntity ref="a" :value="value" type="node--page" :uuid="id" langcode="en" />',
      computed: { id: () => pages[0].id },
    }, { localVue, store: s, mocks, stubs: ['DruxtDebug'] })
    await settle(localVue)
    expect(titleOf(root.vm.$refs.a)).toBe('Parent')

    root.vm.value = undefined
    await localVue.nextTick()
    await root.vm.$refs.a.$fetch()
    await settle(localVue)
    expect(titleOf(root.vm.$refs.a)).toBe(pages[0].attributes.title)

    store(s, pages[0], 'Stored')
    await settle(localVue)
    expect(titleOf(root.vm.$refs.a)).toBe('Stored')
  })

  test('an answer from before a flush gives way to a newer copy stored meanwhile', async () => {
    const { localVue, store: s } = setup()
    const get = hold('get', (url) => url.includes(`/node/page/${pages[0].id}`))
    let wrapper
    try {
      wrapper = mount(DruxtEntity, { localVue, store: s, mocks, propsData: { type: 'node--page', uuid: pages[0].id, langcode: 'en' }, stubs: ['DruxtDebug'] })
      await get.hit
      // The store drops the answer of a request a flush overtook, and something else stores a newer copy.
      s.commit('druxt/flushResource', {})
      store(s, pages[0], 'Newer')
    } finally {
      get.release()
    }
    await settle(localVue)
    expect(titleOf(wrapper.vm)).toBe('Newer')
  })

  test('a cleared field is an unsaved edit, which a store write leaves alone', async () => {
    const { localVue, store: s, root, a } = await mountPair()
    root.vm.schemaType = 'form'
    await settle(localVue)
    // Read as a page's "unsaved changes" notice reads it.
    expect(a.dirty).toBe(false)

    // The field's input handler removes an emptied value.
    const title = a.getScopedSlots().title
    expect(title).toBeTruthy()
    title().componentOptions.listeners.input('')
    await localVue.nextTick()
    expect(a.model.attributes.title).toBe(undefined)
    expect(a.dirty).toBe(true)

    store(s, pages[0], 'Stored')
    await settle(localVue)
    expect(a.model.attributes.title).toBe(undefined)
    expect(a.dirty).toBe(true)
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

  test('a server-rendered entity fetches again after a flush, and keeps its content meanwhile', async () => {
    const { localVue, store: s } = setup({ fetch: false })
    store(s, pages[0], pages[0].attributes.title)
    const model = copy(s.state.druxt.resources['node--page'][pages[0].id].en.data)
    const Hydrated = { extends: DruxtEntity, created() { this.model = copy(model) } }
    const wrapper = mount(Hydrated, {
      localVue,
      store: s,
      mocks,
      propsData: { type: 'node--page', uuid: pages[0].id, langcode: 'en' },
      stubs: ['DruxtDebug'],
    })
    await settle(localVue)
    expect(pageRequests(pages[0].id)).toHaveLength(0)

    s.dispatch('druxt/clearCache')
    await localVue.nextTick()
    expect(titleOf(wrapper.vm)).toBe(pages[0].attributes.title)
    await settle(localVue)
    expect(pageRequests(pages[0].id)).toHaveLength(1)
    expect(wrapper.vm.storedEntity).toBeTruthy()
    expect(titleOf(wrapper.vm)).toBe(pages[0].attributes.title)
  })

  test('a hydrated entity keeps its edits', async () => {
    // Nuxt 2 restores a fetch's data in a created hook it adds after the
    // component's own, so the component's created() sees the default model.
    const { localVue, store: s } = setup({ fetch: false })
    store(s, pages[0], pages[0].attributes.title)
    const model = copy(s.state.druxt.resources['node--page'][pages[0].id].en.data)
    const Hydrated = {
      extends: DruxtEntity,
      created() { this.model = copy(model) },
    }

    const wrapper = mount(Hydrated, {
      localVue,
      store: s,
      mocks: { ...mocks, $fetchState: { pending: false } },
      propsData: { type: 'node--page', uuid: pages[0].id, langcode: 'en' },
      stubs: ['DruxtDebug'],
    })
    await localVue.nextTick()
    expect(wrapper.vm.dirty).toBe(false)

    wrapper.vm.model.attributes.title = 'Edited'
    expect(wrapper.vm.dirty).toBe(true)
    store(s, pages[0], 'Stored')
    await localVue.nextTick()
    expect(titleOf(wrapper.vm)).toBe('Edited')
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

    // An edit is the parent's too: it isn't the component's unsaved edit, and
    // a later store write leaves it alone.
    root.vm.$refs.a.model.attributes.title = 'Edited'
    await localVue.nextTick()
    expect(root.vm.$refs.a.dirty).toBe(false)
    store(s, pages[0], 'Stored again')
    await settle(localVue)
    expect(titleOf(root.vm.$refs.a)).toBe('Edited')
    expect(root.vm.value.attributes.title).toBe('Edited')
  })

  describe('when the store empties', () => {

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

      let a
      try {
        ({ a } = await mountPair())
      } finally {
        mockAxios.get.mockImplementation(get)
      }

      expect(flushed).toBe(true)
      expect(pageRequests(pages[0].id)).toHaveLength(2)
      expect(a.storedEntity).toBeTruthy()
    })

    test('a refetch Drupal refuses shows the error state, not an empty entity', async () => {
      const { localVue, store: s, a } = await mountPair()
      const title = titleOf(a)

      // After a sign-out, Drupal refuses the page.
      const get = mockAxios.get.getMockImplementation()
      mockAxios.get.mockImplementation((url, config) => {
        if (!decodeURIComponent(url).includes(`/node/page/${pages[0].id}`)) return get(url, config)
        const err = new Error('Request failed with status code 403')
        err.response = { status: 403, statusText: 'Forbidden', data: { errors: [{ status: '403', title: 'Forbidden' }] } }
        return Promise.reject(err)
      })
      try {
        s.dispatch('druxt/clearCache')
        await settle(localVue)
      } finally {
        mockAxios.get.mockImplementation(get)
      }

      expect(a.component.is).toBe('DruxtDebug')
      expect(titleOf(a)).toBe(title)

      // Signed in again, the next clear brings the entity back.
      s.dispatch('druxt/clearCache')
      await settle(localVue)
      expect(a.component.is).not.toBe('DruxtDebug')
      expect(a.storedEntity).toBeTruthy()
      expect(titleOf(a)).toBe(title)
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

  describe('a save', () => {
    // A form for the page, beside a view of it.
    const mountForm = async ({ langcode = 'en' } = {}) => {
      const { localVue, store: s } = setup()
      localVue.component('DruxtEntityForm', DruxtEntityForm)
      const $druxt = s.$druxt
      $druxt.settings = {}
      const root = mount({
        template: `<div>
          <DruxtEntityForm ref="form" type="node--page" :uuid="id" :langcode="langcode" />
          <DruxtEntity ref="b" type="node--page" :uuid="id" :langcode="langcode" />
        </div>`,
        data: () => ({ langcode }),
        computed: { id: () => pages[0].id },
      }, { localVue, store: s, mocks: { ...mocks, $druxt }, stubs: ['DruxtDebug', 'DruxtEntityFormButtons'] })
      await settle(localVue)
      return { localVue, store: s, root, form: root.vm.$refs.form, b: root.vm.$refs.b }
    }

    test('a save writes the current language and keeps the others', async () => {
      mockAxios.__signIn('editor')
      const { localVue, root, form } = await mountForm()
      form.model = { ...form.model, attributes: { ...form.model.attributes, title: 'English edit' } }
      root.vm.langcode = 'es'
      await settle(localVue)
      form.model = { ...form.model, attributes: { ...form.model.attributes, title: 'Spanish edit' } }
      root.vm.langcode = 'en'
      await settle(localVue)
      expect(titleOf(form)).toBe('English edit')

      mockAxios.patch.mockClear()
      await form.onSubmit()
      await settle(localVue)
      expect(mockAxios.patch).toHaveBeenCalledTimes(1)
      expect(decodeURIComponent(mockAxios.patch.mock.calls[0][0])).toContain('/en/jsonapi/')
      expect(mockAxios.patch.mock.calls[0][1].data.attributes.title).toBe('English edit')
      expect(form.dirty).toBe(false)

      root.vm.langcode = 'es'
      await settle(localVue)
      expect(titleOf(form)).toBe('Spanish edit')
      expect(form.dirty).toBe(true)
    })

    const storedTitle = (s) => s.state.druxt.resources['node--page'][pages[0].id].en.data.attributes.title

    afterEach(() => mockAxios.__signIn(null))

    test('a language change during a save keeps the answer in the saved language', async () => {
      mockAxios.__signIn('editor')
      const { localVue, store: s, root, form } = await mountForm()
      form.model = { ...form.model, attributes: { ...form.model.attributes, title: 'Saved' } }
      const save = hold('patch', () => true)
      let saving
      try {
        saving = form.onSubmit()
        await save.hit
        root.vm.langcode = 'es'
        await settle(localVue)
      } finally {
        save.release()
      }
      await saving
      await settle(localVue)

      expect(storedTitle(s)).toBe('Saved')
      expect(s.state.druxt.resources['node--page'][pages[0].id].es.data.attributes.title).not.toBe('Saved')
      expect(form.model.attributes.langcode).toBe('es')
      expect(titleOf(form)).not.toBe('Saved')

      // The saved language shows what was saved, not the edits before it.
      root.vm.langcode = 'en'
      await settle(localVue)
      expect(titleOf(form)).toBe('Saved')
      expect(form.dirty).toBe(false)
    })

    test('a save while the next language loads sends nothing', async () => {
      mockAxios.__signIn('editor')
      const { localVue, root, form } = await mountForm()
      const load = hold('get', (url) => url.includes('/es/jsonapi/') && url.includes(pages[0].id))
      mockAxios.patch.mockClear()
      try {
        root.vm.langcode = 'es'
        await load.hit
        expect(await form.onSubmit()).toBe(false)
      } finally {
        load.release()
      }
      await settle(localVue)

      expect(mockAxios.patch).not.toHaveBeenCalled()
      expect(form.model.attributes.langcode).toBe('es')
    })

    test('a hydrated form sends nothing while the next language loads', async () => {
      const { localVue, store: s } = setup({ fetch: false })
      store(s, pages[0], pages[0].attributes.title)
      const model = copy(s.state.druxt.resources['node--page'][pages[0].id].en.data)
      const Hydrated = { extends: DruxtEntityForm, created() { this.model = copy(model) } }
      const wrapper = mount(Hydrated, {
        localVue,
        store: s,
        mocks: { ...mocks, $fetchState: { pending: false } },
        propsData: { type: 'node--page', uuid: pages[0].id, langcode: 'en' },
        stubs: ['DruxtDebug', 'DruxtEntityFormButtons'],
      })
      await localVue.nextTick()
      mockAxios.patch.mockClear()

      // As the fetch for the new language does, before its request.
      await wrapper.setProps({ langcode: 'es' })
      wrapper.vm.switchLanguage()
      expect(await wrapper.vm.onSubmit()).toBe(false)
      expect(mockAxios.patch).not.toHaveBeenCalled()
    })

    test('an edit while a save runs stays', async () => {
      mockAxios.__signIn('editor')
      const { localVue, form } = await mountForm()
      form.model = { ...form.model, attributes: { ...form.model.attributes, title: 'Saved' } }
      const save = hold('patch', () => true)
      let saving
      try {
        saving = form.onSubmit()
        await save.hit
        form.model = { ...form.model, attributes: { ...form.model.attributes, body: { value: 'Edited during the save', format: 'basic_html' } } }
      } finally {
        save.release()
      }
      await saving
      await settle(localVue)

      expect(titleOf(form)).toBe('Saved')
      expect(form.model.attributes.body.value).toBe('Edited during the save')
      expect(form.model.attributes.changed).toBe(form.response.data.data.attributes.changed)
      expect(form.dirty).toBe(true)
    })

    test('an edit while a save runs stays after a language change', async () => {
      mockAxios.__signIn('editor')
      const { localVue, root, form } = await mountForm()
      form.model = { ...form.model, attributes: { ...form.model.attributes, title: 'Saved' } }
      const save = hold('patch', () => true)
      let saving
      try {
        saving = form.onSubmit()
        await save.hit
        form.model = { ...form.model, attributes: { ...form.model.attributes, body: { value: 'Edited during the save', format: 'basic_html' } } }
        root.vm.langcode = 'es'
        await settle(localVue)
      } finally {
        save.release()
      }
      await saving
      await settle(localVue)

      root.vm.langcode = 'en'
      await settle(localVue)
      expect(titleOf(form)).toBe('Saved')
      expect(form.model.attributes.body.value).toBe('Edited during the save')
      expect(form.model.attributes.changed).toBe(form.response.data.data.attributes.changed)
      expect(form.dirty).toBe(true)
    })

    test('a field cleared while a save runs stays cleared', async () => {
      mockAxios.__signIn('editor')
      const { localVue, form } = await mountForm()
      form.model = { ...form.model, attributes: { ...form.model.attributes, title: 'Saved' } }
      const save = hold('patch', () => true)
      let saving
      try {
        saving = form.onSubmit()
        await save.hit
        // As the field input handler does for an emptied field.
        const attributes = { ...form.model.attributes }
        delete attributes.title
        form.model = { ...form.model, attributes }
      } finally {
        save.release()
      }
      await saving
      await settle(localVue)

      expect(form.response.data.data.attributes.title).toBe('Saved')
      expect(titleOf(form)).toBeUndefined()
      expect(form.dirty).toBe(true)
    })

    test("a save that returns while the form holds another language's model keeps that model out", async () => {
      mockAxios.__signIn('editor')
      const { localVue, store: s } = setup({ fetch: false })
      s.$druxt.settings = {}
      store(s, pages[0], pages[0].attributes.title)
      store(s, { ...pages[0], attributes: { ...pages[0].attributes, langcode: 'es' } }, 'En español', 'es')
      const resources = s.state.druxt.resources['node--page'][pages[0].id]
      const english = copy(resources.en.data)
      const Hydrated = { extends: DruxtEntityForm, created() { this.model = copy(english) } }
      const wrapper = mount(Hydrated, {
        localVue,
        store: s,
        mocks: { ...mocks, $druxt: s.$druxt, $fetchState: { pending: false } },
        propsData: { type: 'node--page', uuid: pages[0].id, langcode: 'en' },
        stubs: ['DruxtDebug', 'DruxtEntityFormButtons'],
      })
      await localVue.nextTick()
      const form = wrapper.vm

      const save = hold('patch', () => true)
      let saving
      try {
        saving = form.onSubmit()
        await save.hit
        // As the fetches do, with Spanish loaded and English not yet loaded
        // again when the save returns.
        await wrapper.setProps({ langcode: 'es' })
        form.switchLanguage()
        form.setModelFromStore(copy(resources.es.data))
        await wrapper.setProps({ langcode: 'en' })
        form.switchLanguage()
      } finally {
        save.release()
      }
      await saving

      expect(form.model.attributes.langcode).toBe('en')
      expect(titleOf(form)).toBe(english.attributes.title)
      expect(form.dirty).toBe(false)
    })

    test('Reset while the next language loads leaves a save refused', async () => {
      mockAxios.__signIn('editor')
      const { localVue, root, form } = await mountForm()
      const load = hold('get', (url) => url.includes('/es/jsonapi/') && url.includes(pages[0].id))
      mockAxios.patch.mockClear()
      try {
        root.vm.langcode = 'es'
        await load.hit
        form.onReset()
        expect(await form.onSubmit()).toBe(false)
      } finally {
        load.release()
      }
      await settle(localVue)

      expect(mockAxios.patch).not.toHaveBeenCalled()
      expect(form.model.attributes.langcode).toBe('es')
    })

    test('a save reaches the store and the page', async () => {
      // umami's editor may edit any page.
      mockAxios.__signIn('editor')
      const { localVue, store: s, form, b } = await mountForm()
      form.model = { ...form.model, attributes: { ...form.model.attributes, title: 'Saved' } }
      expect(form.dirty).toBe(true)

      await form.onSubmit()
      await settle(localVue)

      expect(form.errors).toBeUndefined()
      expect(storedTitle(s)).toBe('Saved')
      expect(titleOf(b)).toBe('Saved')
      expect(form.dirty).toBe(false)
      const model = { ...form.model }
      delete model.included
      expect(model).toStrictEqual(JSON.parse(JSON.stringify(form.response.data.data)))
    })

    test('a save in another language goes to that translation', async () => {
      mockAxios.__signIn('editor')
      const { localVue, store: s, form, b } = await mountForm({ langcode: 'es' })
      const english = s.state.druxt.resources['node--page'][pages[0].id].en
      form.model = { ...form.model, attributes: { ...form.model.attributes, title: 'Saved in Spanish' } }

      await form.onSubmit()
      await settle(localVue)

      expect(decodeURIComponent(mockAxios.patch.mock.calls[0][0])).toContain('/es/jsonapi/')
      expect(s.state.druxt.resources['node--page'][pages[0].id].es.data.attributes.title).toBe('Saved in Spanish')
      expect(s.state.druxt.resources['node--page'][pages[0].id].es.data.attributes.langcode).toBe('es')
      expect(s.state.druxt.resources['node--page'][pages[0].id].en).toBe(english)
      expect(titleOf(b)).toBe('Saved in Spanish')
    })

    test('a failed save leaves the store and the edits', async () => {
      const { localVue, store: s, form } = await mountForm()
      const title = storedTitle(s)
      form.model = { ...form.model, attributes: { ...form.model.attributes, title: 'Not saved' } }

      await form.onSubmit()
      await settle(localVue)

      expect(form.response).toBeTruthy()
      expect(storedTitle(s)).toBe(title)
      expect(titleOf(form)).toBe('Not saved')
      expect(form.dirty).toBe(true)
    })

    test('Reset while the entity loads again after a flush returns to what was loaded', async () => {
      const { localVue, store: s, form } = await mountForm()
      const title = titleOf(form)
      form.model.attributes.title = 'Changed'
      const get = hold('get', (url) => url.includes(`/node/page/${pages[0].id}`))
      try {
        s.commit('druxt/flushResource', {})
        await get.hit
        expect(form.storedEntity).toBe(undefined)
        form.onReset()
        expect(titleOf(form)).toBe(title)
        expect(form.dirty).toBe(false)
      } finally {
        get.release()
      }
      await settle(localVue)
      expect(titleOf(form)).toBe(title)
    })

    test('an edit back to the first value while a save runs stays after a language change', async () => {
      mockAxios.__signIn('editor')
      const { localVue, root, form } = await mountForm()
      const title = titleOf(form)
      form.model = { ...form.model, attributes: { ...form.model.attributes, title: 'Submitted' } }
      const save = hold('patch', () => true)
      let saving
      try {
        saving = form.onSubmit()
        await save.hit
        // Back to what it was before the save, which is an edit of what is being saved.
        form.model = { ...form.model, attributes: { ...form.model.attributes, title } }
        root.vm.langcode = 'es'
        await settle(localVue)
      } finally {
        save.release()
      }
      await saving
      await settle(localVue)

      root.vm.langcode = 'en'
      await settle(localVue)
      expect(titleOf(form)).toBe(title)
      expect(form.dirty).toBe(true)
    })

    test('an edit while a save runs stays when its language is chosen again before it loads', async () => {
      mockAxios.__signIn('editor')
      setFetchDelay(150)
      try {
        const { localVue, root, form } = await mountForm()
        form.model = { ...form.model, attributes: { ...form.model.attributes, title: 'Saved' } }
        const save = hold('patch', () => true)
        let saving
        try {
          saving = form.onSubmit()
          await save.hit
          form.model = { ...form.model, attributes: { ...form.model.attributes, body: { value: 'Edited during the save', format: 'basic_html' } } }
          root.vm.langcode = 'es'
          // Spanish has loaded, and its fetch is still running out the delay when English is chosen again.
          for (let i = 0; i < 100 && form.model.attributes.langcode !== 'es'; i++) await new Promise((resolve) => setTimeout(resolve, 5))
          expect(form.model.attributes.langcode).toBe('es')
          expect(form._fetchPromise).toBeTruthy()
          root.vm.langcode = 'en'
          await localVue.nextTick()
        } finally {
          save.release()
        }
        await saving
        await settle(localVue)
        await new Promise((resolve) => setTimeout(resolve, 400))
        await settle(localVue)

        expect(form.model.attributes.langcode).toBe('en')
        expect(titleOf(form)).toBe('Saved')
        expect(form.model.attributes.body.value).toBe('Edited during the save')
        expect(form.dirty).toBe(true)
        expect(Object.keys(form._druxtDrafts)).toStrictEqual([])
      } finally {
        setFetchDelay(0)
      }
    })

    test('Reset returns to the stored resource', async () => {
      const { localVue, store: s, form } = await mountForm()
      form.model.attributes.title = 'Changed'
      expect(form.dirty).toBe(true)

      form.onReset()
      await localVue.nextTick()
      const model = { ...form.model }
      delete model.included
      expect(model).toStrictEqual(JSON.parse(JSON.stringify(s.state.druxt.resources['node--page'][pages[0].id].en.data)))
      expect(form.dirty).toBe(false)
    })
  })

  describe('edits per language', () => {

    test("a language switch shows that language, not the other's edits", async () => {
      const { localVue, root, a } = await mountPair()
      a.model = { ...a.model, attributes: { ...a.model.attributes, title: 'English edit' } }

      root.vm.langcode = 'es'
      await settle(localVue)
      expect(a.model.attributes.langcode).toBe('es')
      expect(titleOf(a)).not.toBe('English edit')
      expect(a.dirty).toBe(false)
    })

    test('each language keeps its own edits', async () => {
      const { localVue, root, a } = await mountPair()
      a.model = { ...a.model, attributes: { ...a.model.attributes, title: 'English edit' } }
      root.vm.langcode = 'es'
      await settle(localVue)
      a.model = { ...a.model, attributes: { ...a.model.attributes, title: 'Spanish edit' } }

      root.vm.langcode = 'en'
      await settle(localVue)
      expect(titleOf(a)).toBe('English edit')
      expect(a.dirty).toBe(true)

      root.vm.langcode = 'es'
      await settle(localVue)
      expect(titleOf(a)).toBe('Spanish edit')
      expect(a.dirty).toBe(true)
    })

    test('a language switch fetches the entity once', async () => {
      const { localVue, root, a } = await mountPair()
      mockAxios.get.mockClear()
      // A second fetch is answered from the store, which counting requests misses.
      const fetches = jest.spyOn(a, '$fetch')

      root.vm.langcode = 'es'
      await settle(localVue)
      expect(fetches).toHaveBeenCalledTimes(1)
      expect(pageRequests(pages[0].id)).toHaveLength(1)
    })

    const spanishPage = (url) => url.includes(`/es/jsonapi/node/page/${pages[0].id}`)

    test('an edit while the next language loads stays out of the kept edits', async () => {
      const { localVue, root, a } = await mountPair()
      a.model = { ...a.model, attributes: { ...a.model.attributes, title: 'English edit' } }
      const es = hold('get', spanishPage)
      try {
        root.vm.langcode = 'es'
        await es.hit
        a.model.attributes.title = 'Typed while loading'
      } finally {
        es.release()
      }
      await settle(localVue)

      root.vm.langcode = 'en'
      await settle(localVue)
      expect(titleOf(a)).toBe('English edit')
    })

    test('switching back while the other language loads keeps this language', async () => {
      const { localVue, root, a } = await mountPair()
      a.model = { ...a.model, attributes: { ...a.model.attributes, title: 'English edit' } }
      const es = hold('get', spanishPage)
      try {
        root.vm.langcode = 'es'
        await es.hit
        root.vm.langcode = 'en'
        await localVue.nextTick()
      } finally {
        es.release()
      }
      await settle(localVue)

      expect(a.model.attributes.langcode).toBe('en')
      expect(titleOf(a)).toBe('English edit')
      expect(a.dirty).toBe(true)
    })

    test('a language changed back while a fetch waits out its delay still loads', async () => {
      // Nuxt keeps a fetch running for its `fetchDelay` after the answer, and
      // `$fetch()` joins a running fetch.
      setFetchDelay(150)
      try {
        const { localVue, root, a } = await mountPair()
        root.vm.langcode = 'es'
        // Spanish has loaded, and its fetch is still running out the delay.
        for (let i = 0; i < 100 && a.model.attributes.langcode !== 'es'; i++) await new Promise((resolve) => setTimeout(resolve, 5))
        expect(a.model.attributes.langcode).toBe('es')
        expect(a._fetchPromise).toBeTruthy()
        root.vm.langcode = 'en'
        await settle(localVue)
        await new Promise((resolve) => setTimeout(resolve, 400))
        await settle(localVue)

        expect(a.lang).toBe('en')
        expect(a.model.attributes.langcode).toBe('en')
        expect(a._druxtModelLang).toBe('en')
      } finally {
        setFetchDelay(0)
      }
    })

    test("a uuid change drops every language's edits", async () => {
      const { localVue, root, a } = await mountPair({ type: 'node--recipe' })
      a.model = { ...a.model, attributes: { ...a.model.attributes, title: 'English edit' } }
      root.vm.langcode = 'es'
      await settle(localVue)

      root.vm.uuid = recipes[1].id
      await settle(localVue)
      root.vm.langcode = 'en'
      await settle(localVue)
      expect(a.model.id).toBe(recipes[1].id)
      expect(titleOf(a)).toBe(recipes[1].attributes.title)
      expect(a.dirty).toBe(false)
    })

    test("a uuid change to an entity the store already holds drops every language's edits", async () => {
      const { localVue, store: s, root, a } = await mountPair({ type: 'node--recipe' })
      // The next entity is in the store already, as from a listing.
      await s.dispatch('druxt/getResource', { type: 'node--recipe', id: recipes[1].id, prefix: 'en' })
      root.vm.langcode = 'es'
      await settle(localVue)
      a.model = { ...a.model, attributes: { ...a.model.attributes, title: 'Spanish edit' } }
      root.vm.langcode = 'en'
      await settle(localVue)
      expect(Object.keys(a._druxtDrafts)).toStrictEqual(['es'])

      root.vm.uuid = recipes[1].id
      await settle(localVue)
      expect(Object.keys(a._druxtDrafts || {})).toStrictEqual([])

      // The other language shows the new entity, never the first one's edit.
      const es = hold('get', (url) => url.includes(`/es/jsonapi/node/recipe/${recipes[1].id}`))
      try {
        root.vm.langcode = 'es'
        await es.hit
        await localVue.nextTick()
        expect(titleOf(a)).not.toBe('Spanish edit')
      } finally {
        es.release()
      }
      await settle(localVue)
      expect(a.model.id).toBe(recipes[1].id)
      expect(a.dirty).toBe(false)
    })
  })
})

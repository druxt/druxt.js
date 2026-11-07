import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'
import { getMockResource } from '../../../test-utils/src'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import { DruxtSchemaStore } from '../../../schema/src'

import DruxtEntityForm from '../../src/components/DruxtEntityForm.vue'
import DruxtEntityFormButtons from '../../src/components/DruxtEntityFormButtons.vue'
import DruxtField from '../../src/components/DruxtField.vue'

let localVue
let store

const $druxt = new DruxtClient('https://api.umami.demo.druxtjs.org')
$druxt.settings = {}

const mocks = {
  $druxt,
  $fetchState: {
    pending: false
  },
  $nuxt: {
    context: {
      isDev: false,
    },
  },
  $route: { meta: {} }
}

const mountComponent = async (propsData) => {
  const wrapper = mount(DruxtEntityForm, { localVue, mocks, propsData, store, stubs: ['DruxtEntityForm'] })
  await wrapper.vm.$options.fetch.call(wrapper.vm)
  return wrapper
}

describe('DruxtEntityForm', () => {
  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(Vuex)
    localVue.component('DruxtEntityFormButtons', DruxtEntityFormButtons)
    localVue.component('DruxtField', DruxtField)

    mockAxios.reset()
    // Signed out between tests: a write test names the account it needs.
    mockAxios.__signIn?.(null)

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = $druxt

    DruxtSchemaStore({ store })
    store.$druxtSchema = {
      import: (schema) => {
        return require(`../../../../test/__fixtures__/schemas/${schema}.json`)
      }
    }

    store.app = { context: { error: jest.fn() }, store }
  })

  test('create', async () => {
    mockAxios.__signIn?.('author')
    const wrapper = await mountComponent({ type: 'node--page' })

    // Props.
    expect(wrapper.vm.mode).toBe('default')
    expect(wrapper.vm.type).toBe('node--page')
    expect(wrapper.vm.uuid).toBe(false)

    // Data.
    expect(wrapper.vm.response).toBe(undefined)

    // Set payload.
    wrapper.vm.model.attributes.title = 'Test'

    // Submit.
    await wrapper.find('button#submit').trigger('click')
    await localVue.nextTick()
    await localVue.nextTick()
    expect(wrapper.emitted().error).toBeFalsy()
    expect(wrapper.emitted().submit).toBeTruthy()
    expect(wrapper.vm.response.data.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
    expect(wrapper.vm.errors).toBe(undefined)
    expect(wrapper.vm.$refs.title.errors.length).toBe(0)

    // Reset button.
    wrapper.find('button#reset').trigger('click')
    await localVue.nextTick()
    expect(wrapper.emitted().reset).toStrictEqual([[]])
    expect(wrapper.vm.response).toBe(undefined)

    wrapper.vm.submitting = true
    expect(await wrapper.vm.onSubmit()).toBe(false)
  })

  test('error', async () => {
    // Signed in, so submitting without a title fails validation rather than
    // permission, which is what this test is about.
    mockAxios.__signIn?.('author')
    const wrapper = await mountComponent({ type: 'node--page' })

    // Props.
    expect(wrapper.vm.mode).toBe('default')
    expect(wrapper.vm.type).toBe('node--page')
    expect(wrapper.vm.uuid).toBe(false)

    // Data.
    expect(wrapper.vm.response).toBe(undefined)

    // Submit.
    await wrapper.find('button#submit').trigger('click')
    await localVue.nextTick()
    await localVue.nextTick()
    expect(wrapper.emitted().error).toBeTruthy()
    expect(wrapper.emitted().submit).toBeFalsy()
    expect(wrapper.vm.entity.id).toBe(undefined)
    expect(wrapper.vm.errors.length).toBe(1)
    expect(wrapper.vm.$refs.title.errors.length).toBe(1)

    // Reset button.
    wrapper.find('button#reset').trigger('click')
    await localVue.nextTick()
    expect(wrapper.emitted().reset).toStrictEqual([[]])
    expect(wrapper.vm.response).toBe(undefined)
    expect(wrapper.vm.errors).toBe(undefined)
    expect(wrapper.vm.$refs.title.errors.length).toBe(0)
  })

  test('network error', async () => {
    const wrapper = await mountComponent({ type: 'node--page' })
    wrapper.vm.model.attributes.title = 'Test'

    // Reject without a response, as a network-level failure does - the
    // error handler must not assume err.response exists.
    const client = wrapper.vm.$druxt
    const createResource = client.createResource
    client.createResource = () => Promise.reject(new Error('Network Error'))

    await wrapper.find('button#submit').trigger('click')
    await localVue.nextTick()
    await localVue.nextTick()

    client.createResource = createResource

    expect(wrapper.emitted().error).toStrictEqual([[undefined]])
    expect(wrapper.vm.response).toBe(undefined)
    expect(wrapper.vm.submitting).toBe(false)
  })

  test('create - refused while signed out', async () => {
    const wrapper = await mountComponent({ type: 'node--page' })

    // A title, so the only thing left to refuse the write is permission.
    wrapper.vm.model.attributes.title = 'Test'

    await wrapper.find('button#submit').trigger('click')
    await localVue.nextTick()
    await localVue.nextTick()

    expect(wrapper.emitted().submit).toBeFalsy()
    expect(wrapper.emitted().error).toBeTruthy()
    // The status, not the count: a missing required field is also an error
    // with a non-empty list, and this test is about the refusal.
    expect(wrapper.vm.errors.map((error) => error.status)).toStrictEqual(['403'])
  })

  test('edit', async () => {
    // umami moderates its content, and the editor holds the transitions.
    mockAxios.__signIn?.('editor')
    const mockPage = await getMockResource('node--page')
    const uuid = mockPage.data.id
    const wrapper = await mountComponent({ uuid, type: 'node--page' })

    // Props.
    expect(wrapper.vm.mode).toBe('default')
    expect(wrapper.vm.type).toBe('node--page')
    expect(wrapper.vm.uuid).toBe(uuid)

    // Data.
    expect(wrapper.vm.response).toBe(undefined)

    // Submit.
    await wrapper.find('button#submit').trigger('click')
    await localVue.nextTick()
    expect(wrapper.emitted().error).toBeFalsy()
    expect(wrapper.emitted().submit).toBeTruthy()
    // expect(wrapper.vm.response.data.data.id).toBe(uuid)
    expect(wrapper.vm.errors).toBe(undefined)
    expect(wrapper.vm.$refs.title.errors.length).toBe(0)

    // Reset button.
    wrapper.find('button#reset').trigger('click')
    await localVue.nextTick()
    expect(wrapper.emitted().reset).toStrictEqual([[]])
    expect(wrapper.vm.response).toBe(undefined)
    expect(wrapper.vm.errors).toBe(undefined)
    expect(wrapper.vm.$refs.title.errors.length).toBe(0)
  })
})

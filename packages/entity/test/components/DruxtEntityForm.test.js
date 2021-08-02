import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'
import { getMockResource } from 'druxt-test-utils'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import { DruxtSchemaStore } from '../../../schema/src'

import DruxtEntityForm from '../../src/components/DruxtEntityForm.vue'
import DruxtEntityFormButtons from '../../src/components/DruxtEntityFormButtons.vue'
import DruxtField from '../../src/components/DruxtField.vue'

let localVue
let store

const $druxt = new DruxtClient('https://demo-api.druxtjs.org')

const mocks = {
  $druxt,
  $druxtEntity: {
    options: {},
  },
  $fetchState: {
    pending: false
  },
  $nuxt: {
    context: {
      isDev: false,
    },
  },
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
    // expect(wrapper.emitted().error).toBeFalsy()
    // expect(wrapper.emitted().submit).toBeTruthy()
    // expect(wrapper.vm.response.data.data.id).toBe('8e8d340a-04af-461a-ac63-12415d33e936')
    // expect(wrapper.vm.errors).toBe(undefined)
    // expect(wrapper.vm.$refs.title.errors.length).toBe(0)

    // Reset button.
    wrapper.find('button#reset').trigger('click')
    await localVue.nextTick()
    expect(wrapper.emitted().reset).toStrictEqual([[]])
    expect(wrapper.vm.response).toBe(undefined)

    wrapper.vm.submitting = true
    expect(await wrapper.vm.onSubmit()).toBe(false)
  })

  test('error', async () => {
    const wrapper = await mountComponent({ type: 'node--page' })

    // Props.
    expect(wrapper.vm.mode).toBe('default')
    expect(wrapper.vm.type).toBe('node--page')
    expect(wrapper.vm.uuid).toBe(false)

    // Data.
    expect(wrapper.vm.response).toBe(undefined)

    // Submit.
    await wrapper.find('button#submit').trigger('click')
    expect(wrapper.emitted().error).toBeTruthy()
    expect(wrapper.emitted().submit).toBeFalsy()
    expect(wrapper.vm.entity.id).toBe(undefined)
    // expect(wrapper.vm.errors.length).toBe(1)
    // expect(wrapper.vm.$refs.title.errors.length).toBe(1)

    // Reset button.
    wrapper.find('button#reset').trigger('click')
    await localVue.nextTick()
    expect(wrapper.emitted().reset).toStrictEqual([[]])
    expect(wrapper.vm.response).toBe(undefined)
    expect(wrapper.vm.errors).toBe(undefined)
    expect(wrapper.vm.$refs.title.errors.length).toBe(0)
  })

  test('edit', async () => {
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
    expect(wrapper.emitted().error).toBeFalsy()
    // expect(wrapper.emitted().submit).toBeTruthy()
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

import mockAxios from 'jest-mock-axios'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouter, DruxtRouterComponent, DruxtRouterStore } from '..'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// Setup vuex store.
const store = new Vuex.Store()
DruxtRouterStore({ store })
store.$druxtRouter = () => new DruxtRouter('https://example.com')

// Fetch callback for component.
const fetch = async fullPath => {
  return DruxtRouterComponent.fetch({
    store,
    redirect: () => {},
    route: { fullPath }
  })
}

describe('DruxtRouterComponent', () => {
  test('Homepage', async () => {
    await fetch('/')
    expect(mockAxios.get).toHaveBeenNthCalledWith(1, '/router/translate-path?path=/', expect.any(Object))

    const wrapper = shallowMount(DruxtRouterComponent, { store, localVue })

    expect(wrapper.vm.title).toBe('Welcome to Contenta CMS!')

    expect(wrapper.vm.entity).toHaveProperty('id', '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9')

    expect(wrapper.vm.route).toHaveProperty('label')
    expect(wrapper.vm.route).toHaveProperty('entity.uuid')
    expect(wrapper.vm.route).toHaveProperty('entity.type')
    expect(wrapper.vm.route).toHaveProperty('entity.bundle')
    expect(wrapper.vm.route).toHaveProperty('entity.canonical')
  })

  test('Redirect', async () => {
    await fetch('/node/6')
    const wrapper = shallowMount(DruxtRouterComponent, { store, localVue })
    expect(wrapper.vm.redirect).toBe('/')
  })
})

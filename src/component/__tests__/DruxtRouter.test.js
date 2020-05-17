import mockAxios from 'jest-mock-axios'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouter, DruxtRouterComponent, DruxtRouterStore } from '../..'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const mocks = {
  $druxtRouter: () => new DruxtRouter('https://example.com')
}

// Fetch callback for component.
const fetch = (fullPath) => {
  return DruxtRouterComponent.fetch({
    store,
    redirect: () => {},
    route: { fullPath }
  })
}

let store

describe('DruxtRouterComponent', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
    DruxtRouterStore({ store })
    store.$druxtRouter = () => new DruxtRouter('https://example.com')
  })

  test('Homepage', async () => {
    await fetch('/')
    expect(mockAxios.get).toHaveBeenNthCalledWith(1, '/router/translate-path?path=/', expect.any(Object))

    // Mount component.
    const wrapper = shallowMount(DruxtRouterComponent, { store, localVue, mocks })
    wrapper.vm.head = DruxtRouterComponent.head

    expect(wrapper.vm.title).toBe('Welcome to Contenta CMS!')

    expect(wrapper.vm.head()).toStrictEqual({
      title: 'Welcome to Contenta CMS!',
      link: [{
        href: 'http://contenta.druxt.localhost/welcome',
        rel: 'canonical'
      }],
      meta: false
    })

    expect(wrapper.vm.entity).toHaveProperty('id', '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9')

    expect(wrapper.vm.route).toHaveProperty('label')
    expect(wrapper.vm.route).toHaveProperty('entity.uuid')
    expect(wrapper.vm.route).toHaveProperty('entity.type')
    expect(wrapper.vm.route).toHaveProperty('entity.bundle')
    expect(wrapper.vm.route).toHaveProperty('entity.canonical')

    expect(wrapper.vm.props).toStrictEqual({
      type: 'node--page',
      uuid: '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9'
    })
  })

  test('Redirect', async () => {
    await fetch('/node/6')
    const wrapper = shallowMount(DruxtRouterComponent, { store, localVue, mocks })
    expect(wrapper.vm.redirect).toBe('/')
  })

  test('Empty', () => {
    const wrapper = shallowMount(DruxtRouterComponent, { store, localVue })
    expect(wrapper.vm.entity).toBe(undefined)
    expect(wrapper.vm.props).toBe(false)
    expect(wrapper.html()).toBe('')
  })
})

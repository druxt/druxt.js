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

const stubs = ['druxt-entity']

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
    const wrapper = shallowMount(DruxtRouterComponent, { localVue, mocks, store, stubs })
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

    expect(wrapper.vm.component).toBe('druxt-entity')
    expect(wrapper.vm.title).toBe('Welcome to Contenta CMS!')
    expect(wrapper.vm.props).toStrictEqual({
      type: 'node--page',
      uuid: '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9'
    })

    expect(wrapper.vm.route).toHaveProperty('type', 'entity')
    expect(wrapper.vm.route).toHaveProperty('label')
    expect(wrapper.vm.route).toHaveProperty('canonical')
    expect(wrapper.vm.route).toHaveProperty('isHomePath', true)
    expect(wrapper.vm.route).toHaveProperty('redirect', false)
  })

  test('Redirect', async () => {
    await fetch('/node/6')
    const wrapper = shallowMount(DruxtRouterComponent, { localVue, mocks, store, stubs })
    expect(wrapper.vm.redirect).toBe('/')
  })

  test('Empty', () => {
    const wrapper = shallowMount(DruxtRouterComponent, { localVue, store })
    expect(wrapper.vm.entity).toBe(undefined)
    expect(wrapper.vm.props).toBe(false)
    expect(wrapper.html()).toBe('')
  })
})

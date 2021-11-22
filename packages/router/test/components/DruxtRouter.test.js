import 'regenerator-runtime/runtime'
import mockAxios from 'jest-mock-axios'
import { mount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouter, DruxtRouterStore } from '../../src'
import DruxtRouterComponent from '../../src/components/DruxtRouter.vue'
import { baseUrl } from '../../../test-utils/src'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const stubs = ['DruxtEntity']

let store

const mountComponent = (fullPath) => {
  const mocks = {
    $druxt: {
      settings: {
        router: {}
      }
    },
    $fetchState: {
      pending: true
    },
    $nuxt: {
      context: {
        isDev: false,
      },
    },
    $redirect: jest.fn(),
    $route: { fullPath },
    app: {
      context: {
        error: jest.fn()
      }
    }
  }

  const propsData = {}

  return mount(DruxtRouterComponent, { localVue, mocks, propsData, store, stubs })
}

describe('DruxtRouterComponent', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()

    DruxtRouterStore({ store })
    store.$druxtRouter = () => new DruxtRouter(baseUrl)
  })

  test('Homepage', async () => {
    // Mount component.
    const wrapper = mountComponent('/')
    await DruxtRouterComponent.middleware({ $druxt: wrapper.vm.$druxt, store: wrapper.vm.$store, route: wrapper.vm.$route })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(mockAxios.get).toHaveBeenNthCalledWith(1, '/router/translate-path?path=/', expect.any(Object))

    wrapper.vm.head = DruxtRouterComponent.head

    expect(wrapper.vm.title).toBe('Home')

    expect(wrapper.vm.head()).toStrictEqual({
      title: expect.any(String),
      link: [{
        hid: 'canonical',
        href: `${baseUrl}/en/node`,
        rel: 'canonical'
      }]
    })

    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtRouterViewFront',
      'DruxtRouterView',
      'DruxtRouterDefault'
    ])

    expect(wrapper.vm.route).toHaveProperty('type')
    expect(wrapper.vm.route).toHaveProperty('label')
    expect(wrapper.vm.route).toHaveProperty('canonical')
    expect(wrapper.vm.route).toHaveProperty('isHomePath', true)
    expect(wrapper.vm.route).toHaveProperty('redirect', false)
  })

  test('Page', async () => {
    // Mount component.
    const wrapper = mountComponent('/node/1')
    const redirect = jest.fn()
    await DruxtRouterComponent.middleware({ $druxt: wrapper.vm.$druxt, store: wrapper.vm.$store, redirect, route: wrapper.vm.$route })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtRouterEntityNotFront',
      'DruxtRouterEntity',
      'DruxtRouterDefault'
    ])
  })

  test('Middleware - Redirect', async () => {
    // Mount component.
    const wrapper = mountComponent('/en/node')
    const redirect = jest.fn()
    await DruxtRouterComponent.middleware({ $druxt: wrapper.vm.$druxt, store: wrapper.vm.$store, redirect, route: wrapper.vm.$route })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(redirect).toBeCalledWith('/')
  })

  test('Empty', () => {
    // Mount component.
    const wrapper = mountComponent(undefined)

    expect(wrapper.vm.entity).toBe(undefined)
    expect(wrapper.vm.props).toBe(false)
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([])
  })

  test('Metatags', () => {
    const mock = {
      route: { canonical: undefined },
      metatags: [{
        name: 'test'
      }]
    }
    expect(DruxtRouterComponent.head.call(mock)).toStrictEqual({
      link: [{
        hid: 'canonical',
        href: undefined,
        rel: 'canonical'
      }],
      meta: [{
        name: 'test'
      }],
      title: undefined
    })
  })
})

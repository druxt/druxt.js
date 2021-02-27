import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtSite } from '../..'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const mountComponent = (pending) => {
  const mocks = {
    $fetchState: { pending }
  }
  const propsData = { theme: 'umami' }
  const stubs = ['DruxtBlockRegion']

  return mount(DruxtSite, { localVue, mocks, propsData, store, stubs })
}

describe('DruxtSite component', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('defaults', async () => {
    const wrapper = mountComponent(false)
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.theme).toBe('umami')
    expect(wrapper.vm.regions).toStrictEqual([
      'breadcrumbs',
      'highlighted',
      'pre_header',
      'banner_top',
      'header',
      'content',
      'bottom',
      'footer',
      'tabs',
      'page_title',
      'content_bottom'
    ])

    // Druxt Component mixin.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual(['DruxtSiteUmami', 'DruxtSiteDefault'])

    expect(wrapper.html()).toMatchSnapshot()
  })

  test('pending', async () => {
    const wrapper = mountComponent(true)

    expect(wrapper.html()).toMatchSnapshot()
  })
})

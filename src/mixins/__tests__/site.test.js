import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'

import { DruxtSiteMixin } from '../..'

const baseURL = 'https://demo-api.druxtjs.org'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const component = {
  name: 'DruxtSiteTest',
  mixins: [DruxtSiteMixin],
  render: () => ({})
}

describe('DruxtSiteMixin', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtRouter = new DruxtRouter(baseURL, {})
    DruxtRouterStore({ store })
  })

  test('defaults', () => {
    const propsData = { theme: 'umami' }
    const wrapper = mount(component, { localVue, propsData, store })

    expect(wrapper.vm.theme).toBe('umami')
    expect(wrapper.vm.regions).toStrictEqual([])
  })
})

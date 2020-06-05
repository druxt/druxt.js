import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtView } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const mocks = {
  $druxtRouter: () => ({
    getResource: jest.fn().mockResolvedValue({})
  })
}
const stubs = ['druxt-entity']

let store

const mountComponent = () => {
  const propsData = {
    display: 'page_1',
    view: 'featured_articles'
  }
  return mount(DruxtView, { localVue, mocks, propsData, stubs })
}

describe('Component - DruxtView', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
  })

  test('default', async () => {
    const wrapper = mountComponent()

    expect(wrapper.vm).toHaveProperty('display')
    expect(wrapper.vm).toHaveProperty('view')
  })
})

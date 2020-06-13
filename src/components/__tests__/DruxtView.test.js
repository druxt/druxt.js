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
const stubs = ['DruxtEntity', 'DruxtViewFeaturedArticles']

let store

const mountComponent = () => {
  const propsData = {
    displayId: 'page_1',
    uuid: 'test',
    viewId: 'featured_articles'
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

    expect(wrapper.vm).toHaveProperty('displayId')
    expect(wrapper.vm).toHaveProperty('viewId')

    expect(wrapper.vm.component).toBe('DruxtViewFeaturedArticles')
    expect(wrapper.vm.headers).toBe(false)
    expect(wrapper.vm.mode).toBe(false)

    expect(wrapper.vm.props).toHaveProperty('view')
    expect(wrapper.vm.props).toHaveProperty('results')

    expect(wrapper.vm.suggestions).toStrictEqual([
      'DruxtViewFeaturedArticlesPage1',
      'DruxtViewFeaturedArticles'
    ])
  })
})

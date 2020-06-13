import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtView } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// @TODO - Mock axios and add fixtures.
const mocks = {
  $druxtRouter: () => {
    return {
      getResource: jest.fn().mockImplementation(query => {
        const response = {}

        switch (query.type) {
          case 'view--view':
            response.attributes = {
              display: {
                default: {
                  display_options: {
                    header: false,
                    row: {
                      options: {
                        view_mode: 'default'
                      }
                    }
                  }
                }
              }
            }
            break
        }

        return Promise.resolve(response)
      })
    }
  }
}

let store

const mountComponent = (stubs = []) => {
  const propsData = {
    displayId: 'page_1',
    uuid: 'test',
    viewId: 'featured_articles'
  }
  stubs.push('DruxtEntity')
  return mount(DruxtView, { localVue, mocks, propsData, store, stubs })
}

describe('Component - DruxtView', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
  })

  test('default', async () => {
    const wrapper = mountComponent(['DruxtViewFeaturedArticles'])

    expect(wrapper.vm.headers).toBe(false)
    expect(wrapper.vm.mode).toBe(false)

    await localVue.nextTick()

    expect(wrapper.vm.mode).toBe('default')

    expect(wrapper.vm).toHaveProperty('displayId')
    expect(wrapper.vm).toHaveProperty('viewId')

    expect(wrapper.vm.component).toBe('DruxtViewFeaturedArticles')

    expect(wrapper.vm.props).toHaveProperty('view')
    expect(wrapper.vm.props).toHaveProperty('results')

    expect(wrapper.vm.suggestions).toStrictEqual([
      'DruxtViewFeaturedArticlesPage1',
      'DruxtViewFeaturedArticles'
    ])
  })

  test('component', async () => {
    const wrapper = mountComponent()
    expect(wrapper.vm.component).toBe('div')
  })
})

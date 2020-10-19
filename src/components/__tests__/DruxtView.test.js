import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtView } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// Setup mock Vuex store.
const store = new Vuex.Store({
  modules: {
    druxtRouter: {
      namespaced: true,
      actions: {
        getEntity: (ctx, query) => {
          const response = {}

          switch (query.type) {
            case 'view--view':
              response.attributes = {
                display: {
                  default: {
                    display_options: {
                      header: false,
                      row: {
                        type: 'entity:node',
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
        }
      },
    }
  }
})

const mountComponent = (stubs = []) => {
  const mocks = {
    $fetchState: {
      pending: true
    }
  }

  const propsData = {
    displayId: 'page_1',
    uuid: 'test',
    viewId: 'featured_articles'
  }

  stubs.push('DruxtEntity')

  return mount(DruxtView, { localVue, mocks, propsData, store, stubs })
}

describe('Component - DruxtView', () => {
  test('default', async () => {
    const wrapper = mountComponent(['DruxtViewFeaturedArticles'])
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.headers).toBe(false)
    expect(wrapper.vm.mode).toBe('default')

    expect(wrapper.vm).toHaveProperty('displayId')
    expect(wrapper.vm).toHaveProperty('viewId')

    expect(wrapper.vm.component.is).toBe('DruxtViewFeaturedArticles')

    expect(wrapper.vm.component.propsData).toHaveProperty('view')
    expect(wrapper.vm.component.propsData).toHaveProperty('results')

    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewFeaturedArticlesPage1',
      'DruxtViewFeaturedArticles'
    ])
  })

  test('component', async () => {
    const wrapper = mountComponent()
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
  })
})

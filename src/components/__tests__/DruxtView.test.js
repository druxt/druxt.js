import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'
import { DruxtView } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// Setup mock Vuex store.
let store

const mountComponent = (propsData) => {
  const mocks = {
    $fetchState: {
      pending: true
    },
  }

  const view = require(`../__fixtures__/${propsData.uuid}.json`).data
  store.commit('druxt/addResource', { resource: { data: view }, hash: '_default' })
  store.commit('druxt/addResource', {
    resource: {
      data: {
        id: propsData.displayId,
        type: 'node--page',
      }
    },
    hash: '_default'
  })

  return mount(DruxtView, { localVue, mocks, propsData, store })
}

describe('Component - DruxtView', () => {
  beforeEach(() => {
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org')

    store.app = { context: { error: jest.fn() }, store }
  })

  test('featured_articles', async () => {
    const wrapper = mountComponent({
      displayId: 'page_1',
      uuid: '382e41b6-6d8d-4b76-9ed1-ed28ed78199b',
      viewId: 'featured_articles'
    })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Props.
    expect(wrapper.vm.displayId).toBe('page_1')
    expect(wrapper.vm.uuid).toBe('382e41b6-6d8d-4b76-9ed1-ed28ed78199b')
    expect(wrapper.vm.viewId).toBe('featured_articles')

    // Computed.
    expect(wrapper.vm.attachments_after).toStrictEqual([])
    expect(wrapper.vm.attachments_before).toStrictEqual([])
    expect(wrapper.vm.headers).toStrictEqual([])
    expect(wrapper.vm.mode).toBe('card')

    // DruxtComponentMixin.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual([
      'DruxtViewFeaturedArticlesPage1',
      'DruxtViewFeaturedArticles'
    ])
  })
})

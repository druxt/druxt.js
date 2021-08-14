import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from '../../../druxt/src'
import { DruxtRouterEntityMixin } from '../../src'
import { baseUrl, getMockResource } from '../../../test-utils/src'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const testComponent = {
  render () {},
  mixins: [DruxtRouterEntityMixin]
}

let store

describe('DruxtRouterEntityMixin', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient(baseUrl)

    store.app = { context: { error: jest.fn() }, store }
  })

  test('default', async () => {
    const mockPage = await getMockResource('node--page')
    const wrapper = shallowMount(testComponent, {
      propsData: {
        type: 'node--page',
        uuid: mockPage.data.id,
      },
      store,
      localVue
    })

    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.entity).toHaveProperty('id', mockPage.data.id)
  })

  test('cache', async () => {
    store.commit('druxt/addResource', {
      resource: {
        data: {
          id: '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9',
          type: 'node--page',
          cache: true
        }
      },
    })

    const wrapper = shallowMount(testComponent, {
      propsData: {
        type: 'node--page',
        uuid: '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9'
      },
      store,
      localVue
    })

    await wrapper.vm.$options.fetch.call(wrapper.vm)

    expect(wrapper.vm.entity.cache).toBe(true)
  })
})

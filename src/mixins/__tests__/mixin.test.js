import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouter, DruxtRouterEntityMixin, DruxtRouterStore } from '../..'

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
    DruxtRouterStore({ store })

    store.$druxtRouter = () => new DruxtRouter('https://example.com')
  })

  test('default', async () => {
    const wrapper = shallowMount(testComponent, {
      propsData: {
        type: 'node--page',
        uuid: '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9'
      },
      store,
      localVue
    })

    expect(wrapper.vm.loading).toBe(true)

    // Wait for async callbacks to finish.
    for (let i = 0; i < 4; i++) {
      await localVue.nextTick()
    }

    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.entity).toHaveProperty('id', '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9')
  })

  test('cache', () => {
    store.commit('druxtRouter/addEntity', {
      id: '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9',
      cache: true
    })

    const wrapper = shallowMount(testComponent, {
      propsData: {
        type: 'node--page',
        uuid: '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9'
      },
      store,
      localVue
    })

    expect(wrapper.vm.entity.cache).toBe(true)
  })
})

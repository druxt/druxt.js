import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouterEntityMixin, DruxtRouterStore } from '..'

import mockResources from '../__fixtures__/resources'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// Setup vuex store.
const store = new Vuex.Store()
DruxtRouterStore({ store })
store.$druxtRouter = () => ({
  getResource: async ({ id, type }) => mockResources[`/api/${type.replace('--', '/')}/${id}`]
})

const testComponent = {
  render() {},
  mixins: [DruxtRouterEntityMixin]
}

let wrapper

describe('DruxtRouterEntityMixin', () => {
  beforeEach(() => {
    wrapper = shallowMount(testComponent, {
      propsData: {
        type: 'node--page',
        uuid: '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9'
      },
      store,
      localVue
    })
  })

  test('created', () => {
    expect(wrapper.vm.loading).toBe(true)
  })

  test('properties', () => {
    expect(wrapper.vm.entity).toHaveProperty('id', '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9')
  })
})

import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtSchemaMixin, DruxtSchemaStore } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const testComponent = {
  render () {},
  mixins: [DruxtSchemaMixin]
}

let store

describe('DruxtSchemaRouterEntityMixin', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
    DruxtSchemaStore({ store })
    store.$druxtSchema = {
      import: jest.fn(() => ({}))
    }
  })

  test('default', async () => {
    const wrapper = shallowMount(testComponent, {
      propsData: {
        type: 'node--page',
      },
      store,
      localVue
    })
    expect(wrapper.vm.schema).toBe(false)

    // Wait for async callbacks to finish.
    await localVue.nextTick()
    await localVue.nextTick()

    expect(wrapper.vm.schema).toStrictEqual({})
  })
})

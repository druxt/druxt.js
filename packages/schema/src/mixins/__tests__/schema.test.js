import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtSchemaMixin, DruxtSchemaStore } from '../..'

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

    // Bind and execute fetch() method.
    wrapper.vm.$fetch = DruxtSchemaMixin.fetch
    await wrapper.vm.$fetch()

    expect(wrapper.vm.schema).toStrictEqual({})
  })
})

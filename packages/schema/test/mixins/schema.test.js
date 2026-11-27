import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtSchemaMixin, DruxtSchemaStore } from '../../src'

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
  test('in the component\'s language', async () => {
    store.$druxtSchema.import = jest.fn(async () => ({ resourceType: 'node--page', fields: [{ id: 'body', label: { text: 'Body' } }] }))
    store.$druxtSchema.labels = jest.fn(async () => ({ 'node--page': { body: { label: 'Cuerpo', description: null } } }))
    const wrapper = shallowMount({ ...testComponent, computed: { lang: () => 'es' } }, {
      propsData: { type: 'node--page' },
      store,
      localVue
    })

    wrapper.vm.$fetch = DruxtSchemaMixin.fetch
    await wrapper.vm.$fetch()

    expect(wrapper.vm.schema.fields[0].label.text).toBe('Cuerpo')
  })
})

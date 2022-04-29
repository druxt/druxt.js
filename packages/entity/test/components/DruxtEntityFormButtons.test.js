import 'regenerator-runtime/runtime'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtSchemaStore } from 'druxt-schema'
import DruxtEntityFormButtons from '../../src/components/DruxtEntityFormButtons.vue'

let localVue

let store

const mocks = {
  $fetchState: {
    pending: false
  },
  $route: { meta: {} }
}

const mountComponent = async (propsData) => {
  const wrapper = mount(DruxtEntityFormButtons, { localVue, mocks, propsData, store })
  await wrapper.vm.$options.fetch.call(wrapper.vm)
  return wrapper
}

describe('DruxtEntityFormButtons', () => {
  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(Vuex)

    mockAxios.reset()

    // Setup vuex store.
    store = new Vuex.Store()

    DruxtSchemaStore({ store })
    store.$druxtSchema = {
      import: (schema) => {
        return require(`../../../../test/__fixtures__/schemas/${schema}.json`)
      }
    }

    store.app = { context: { error: jest.fn() }, store }
  })

  test('node--page', async () => {
    const schema = store.$druxtSchema.import('node--page--default--form')
    const wrapper = await mountComponent({ schema })

    expect(wrapper.vm.component).toStrictEqual({
      is: 'DruxtWrapper',
      options: [
        'DruxtEntityFormButtonsNodePageDefaultForm',
        'DruxtEntityFormButtonsNodePageDefault',
        'DruxtEntityFormButtonsNodePageForm',
        'DruxtEntityFormButtonsNodePage',
        'DruxtEntityFormButtonsNode',
        'DruxtEntityFormButtonsDefault',
      ],
      settings: {},
      slots: ['submit', 'reset', 'default'],
    })
  })
})

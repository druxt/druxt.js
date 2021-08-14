import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtBlocksBlockMixin } from '../../src/mixins/block'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const component = {
  name: 'DruxtBlockTest',
  mixins: [DruxtBlocksBlockMixin],
  render: () => ({})
}

describe('DruxtBlocksBlockMixin', () => {
  test('defaults', () => {
    const propsData = {
      block: {
        attributes: {
          settings: {}
        }
      }
    }
    const wrapper = mount(component, { localVue, propsData })

    expect(wrapper.vm.settings).toStrictEqual({})
  })
})

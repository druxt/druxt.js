import { createLocalVue, shallowMount } from '@vue/test-utils'

import DruxtFieldTextDefault from '../../../src/components/fields/DruxtFieldTextDefault.vue'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()

describe('Component - DruxtFieldTextDefault', () => {
  test('default', async () => {
    const propsData = {
      value: [{ processed: 'DruxtFieldTextDefault' }],
      schema: {}
    }
    const wrapper = shallowMount(DruxtFieldTextDefault, { localVue, propsData })

    expect(wrapper.vm.format(wrapper.vm.items[0])).toBe('DruxtFieldTextDefault')
  })
})

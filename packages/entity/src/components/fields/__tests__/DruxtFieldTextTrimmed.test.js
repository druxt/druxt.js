import { createLocalVue, shallowMount } from '@vue/test-utils'

import { DruxtFieldTextTrimmed } from '..'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()

const mountComponent = (item, trimLength) => {
  return shallowMount(DruxtFieldTextTrimmed, { localVue, propsData: {
    value: [item],
    schema: {
      settings: {
        display: {
          trim_length: trimLength,
        },
      },
    }
  } })
}

describe('Component - DruxtFieldTextTrimmed', () => {
  test('default', async () => {
    // Trim length: 600 (default).
    let wrapper = mountComponent({ value: 'x'.repeat(1024) })

    expect(wrapper.vm.trimLength).toBe(600)
    expect(wrapper.vm.format(wrapper.vm.items[0]).length).toBe(600)

    // Trim length: 100.
    wrapper = mountComponent({ value: 'x'.repeat(1024) }, 100)

    expect(wrapper.vm.trimLength).toBe(100)
    expect(wrapper.vm.format(wrapper.vm.items[0]).length).toBe(100)
  })
})

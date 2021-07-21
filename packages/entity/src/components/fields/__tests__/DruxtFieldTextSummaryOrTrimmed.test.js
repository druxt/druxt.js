import { createLocalVue, shallowMount } from '@vue/test-utils'

import { DruxtFieldTextSummaryOrTrimmed } from '..'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()

const mountComponent = (item, trimLength) => {
  return shallowMount(DruxtFieldTextSummaryOrTrimmed, { localVue, propsData: {
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

describe('Component - DruxtFieldTextSummaryOrTrimmed', () => {
  test('summary', async () => {
    const wrapper = mountComponent({
      summary: 'Summary',
      value: 'Value',
    })

    expect(wrapper.vm.trimLength).toBe(600)
    expect(wrapper.vm.format(wrapper.vm.items[0])).toBe('Summary')
  })

  test('trimmed', async () => {
    const wrapper = mountComponent({ value: 'x'.repeat(1024) }, 100)

    expect(wrapper.vm.trimLength).toBe(100)
    expect(wrapper.vm.format(wrapper.vm.items[0]).length).toBe(100)
  })
})

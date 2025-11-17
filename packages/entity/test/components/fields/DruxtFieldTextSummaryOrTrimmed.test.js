import { createLocalVue, shallowMount } from '@vue/test-utils'

import DruxtFieldTextSummaryOrTrimmed from '../../../src/components/fields/DruxtFieldTextSummaryOrTrimmed.vue'

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
    // Spy on console.warn to verify deprecation warning is emitted
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const wrapper = mountComponent({
      summary: 'Summary',
      value: 'Value',
    })

    // Verify deprecation warning was emitted
    expect(consoleWarnSpy).toHaveBeenCalledWith('[druxt-entity] The DruxtFieldTextSummaryOrTrimmed component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html')

    consoleWarnSpy.mockRestore()

    expect(wrapper.vm.trimLength).toBe(600)
    expect(wrapper.vm.format(wrapper.vm.items[0])).toBe('Summary')
  })

  test('trimmed', async () => {
    // Spy on console.warn to verify deprecation warning is emitted
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const wrapper = mountComponent({ value: 'x'.repeat(1024) }, 100)

    // Verify deprecation warning was emitted
    expect(consoleWarnSpy).toHaveBeenCalledWith('[druxt-entity] The DruxtFieldTextSummaryOrTrimmed component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html')

    consoleWarnSpy.mockRestore()

    expect(wrapper.vm.trimLength).toBe(100)
    expect(wrapper.vm.format(wrapper.vm.items[0]).length).toBe(100)
  })
})

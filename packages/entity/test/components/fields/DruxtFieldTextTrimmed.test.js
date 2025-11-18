import 'regenerator-runtime/runtime'
import { createLocalVue, shallowMount } from '@vue/test-utils'

import DruxtFieldTextTrimmed from '../../../src/components/fields/DruxtFieldTextTrimmed.vue'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()

const mountComponent = (item, trimLength) => {
  return shallowMount(DruxtFieldTextTrimmed, {
    localVue,
    propsData: {
      value: [item],
      schema: {
        settings: {
          display: {
            trim_length: trimLength,
          },
        },
      },
    },
  })
}

describe('Component - DruxtFieldTextTrimmed', () => {
  test('default', async () => {
    // Spy on console.warn to verify deprecation warning is emitted
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    // Trim length: 600 (default).
    let wrapper = mountComponent({ value: 'x'.repeat(1024) })

    // Verify deprecation warning was emitted
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[druxt-entity] The DruxtFieldTextTrimmed component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html'
    )

    consoleWarnSpy.mockRestore()

    expect(wrapper.vm.trimLength).toBe(600)
    expect(wrapper.vm.format(wrapper.vm.items[0]).length).toBe(600)

    // Trim length: 100.
    const consoleWarnSpy2 = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})
    wrapper = mountComponent({ value: 'x'.repeat(1024) }, 100)

    expect(consoleWarnSpy2).toHaveBeenCalledWith(
      '[druxt-entity] The DruxtFieldTextTrimmed component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html'
    )

    consoleWarnSpy2.mockRestore()

    expect(wrapper.vm.trimLength).toBe(100)
    expect(wrapper.vm.format(wrapper.vm.items[0]).length).toBe(100)
  })
})

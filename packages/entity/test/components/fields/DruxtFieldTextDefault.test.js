import { createLocalVue, shallowMount } from '@vue/test-utils'

import DruxtFieldTextDefault from '../../../src/components/fields/DruxtFieldTextDefault.vue'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()

describe('Component - DruxtFieldTextDefault', () => {
  test('default', async () => {
    const propsData = {
      value: [{ processed: 'DruxtFieldTextDefault' }],
      schema: {},
    }

    // Spy on console.warn to verify deprecation warning is emitted
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const wrapper = shallowMount(DruxtFieldTextDefault, {
      localVue,
      propsData,
    })

    expect(wrapper.vm.format(wrapper.vm.items[0])).toBe('DruxtFieldTextDefault')

    // Verify deprecation warning was emitted
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[druxt-entity] The DruxtFieldTextDefault component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html'
    )

    // Restore console.warn
    consoleWarnSpy.mockRestore()
  })
})

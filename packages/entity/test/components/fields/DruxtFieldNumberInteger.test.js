import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import DruxtFieldNumberInteger from '../../../src/components/fields/DruxtFieldNumberInteger.vue'

jest.mock('axios')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const stubs = ['nuxt-link']

const mountComponent = (prefix = false, suffix = false, options) => {
  const propsData = {
    value: [0, 1, 2],
    schema: {
      settings: {
        config: {
          prefix,
          suffix,
        },
        display: {
          prefix_suffix: !!(prefix || suffix),
        },
      },
    },
  }

  return shallowMount(DruxtFieldNumberInteger, {
    ...options,
    localVue,
    propsData,
    stubs,
  })
}

describe('Component - DruxtFieldNumberInteger', () => {
  beforeEach(() => {
    mockAxios.reset()
  })

  test('default', async () => {
    // Spy on console.warn to verify deprecation warning is emitted
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const wrapper = mountComponent()

    // Verify deprecation warning was emitted
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[druxt-entity] The DruxtFieldNumberInteger component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html'
    )

    consoleWarnSpy.mockRestore()

    expect(wrapper.vm.prefix).toBe(false)
    expect(wrapper.vm.suffix).toBe(false)

    expect(wrapper.vm.items.length).toBe(3)
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('prefix', async () => {
    // Spy on console.warn to verify deprecation warning is emitted
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const wrapper = mountComponent('#')

    // Verify deprecation warning was emitted
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[druxt-entity] The DruxtFieldNumberInteger component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html'
    )

    consoleWarnSpy.mockRestore()

    expect(wrapper.vm.prefix).toBe('#')
    expect(wrapper.vm.suffix).toBe(false)

    expect(wrapper.vm.items.length).toBe(3)
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('suffix', async () => {
    // Spy on console.warn to verify deprecation warning is emitted
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const wrapper = mountComponent(false, ' item(s)')

    // Verify deprecation warning was emitted
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[druxt-entity] The DruxtFieldNumberInteger component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html'
    )

    consoleWarnSpy.mockRestore()

    expect(wrapper.vm.prefix).toBe(false)
    expect(wrapper.vm.suffix).toBe(' item(s)')

    expect(wrapper.vm.items.length).toBe(3)
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('prefix_suffix', async () => {
    // Spy on console.warn to verify deprecation warning is emitted
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const wrapper = mountComponent('AUD $', '.00')

    // Verify deprecation warning was emitted
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[druxt-entity] The DruxtFieldNumberInteger component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html'
    )

    consoleWarnSpy.mockRestore()

    expect(wrapper.vm.prefix).toBe('AUD $')
    expect(wrapper.vm.suffix).toBe('.00')

    expect(wrapper.vm.items.length).toBe(3)
    expect(wrapper.html()).toMatchSnapshot()
  })
})

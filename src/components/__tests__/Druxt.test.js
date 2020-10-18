import { createLocalVue, mount } from '@vue/test-utils'

import { Druxt } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()

const mountWrapper = (propsData) => {
  return mount(Druxt, { localVue, propsData, stubs: ['DruxtTestModule'] })
}

describe('Druxt component', () => {
  test('defaults', async () => {
    const wrapper = mountWrapper({ module: 'test-module' })

    // Props.
    expect(wrapper.vm.module).toBe('test-module')
    expect(wrapper.vm.propsData).toStrictEqual({})
    expect(wrapper.vm.wrapper.component).toBe('div')
    expect(wrapper.vm.inner.component).toBe('div')

    // Data.
    expect(wrapper.vm.component.is).toBe('DruxtTestModule')
    expect(wrapper.vm.component.propsData).toStrictEqual({})

    // HTML snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('missing module', async () => {
    const wrapper = mountWrapper({ module: 'test-missing-module' })
    expect(wrapper.vm.component.is).toBe(undefined)
  })

  test('wrapper', () => {
    const wrapper = mountWrapper({
      module: 'test-module',
      wrapper: {
        component: 'span'
      }
    })

    // Props.
    expect(wrapper.vm.wrapper.component).toBe('span')
    expect(wrapper.vm.inner.component).toBe('div')

    // HTML snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })

  test('unwrapped', () => {
    const wrapper = mountWrapper({
      module: 'test-module',
      wrapper: false
    })

    // Props.
    expect(wrapper.vm.wrapper).toBe(false)
    expect(wrapper.vm.inner.component).toBe('div')

    // HTML snapshot.
    expect(wrapper.html()).toMatchSnapshot()
  })
})

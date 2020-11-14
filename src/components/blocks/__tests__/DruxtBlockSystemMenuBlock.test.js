import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtBlockSystemMenuBlock } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
const stubs = ['DruxtMenu']

// @TODO - Mock axios and add fixtures.
const mocks = {
  $druxtRouter: () => ({
    getResources: jest.fn().mockImplementation(() => Promise.resolve([{
      id: 'uuid'
    }]))
  })
}

const mockBlock = {
  id: 'test-block',
  attributes: {
    settings: {
      id: 'system_menu_block:main'
    }
  }
}

const mountComponent = (entity, options = {}) => {
  const propsData = { block: entity }

  return mount(DruxtBlockSystemMenuBlock, { localVue, mocks, propsData, stubs, ...options })
}

describe('Component - DruxtBlockSystemMenuBlock', () => {
  test('default', async () => {
    const wrapper = mountComponent(mockBlock)

    await localVue.nextTick()

    expect(wrapper.vm.name).toBe('main')
  })
})

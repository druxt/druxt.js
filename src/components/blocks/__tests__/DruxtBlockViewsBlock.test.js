import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtBlockViewsBlock } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
const stubs = ['druxt-view']

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
      id: 'views_block:view_id-display_id'
    }
  }
}

const mountComponent = (entity, options = {}) => {
  const propsData = { block: entity }

  return mount(DruxtBlockViewsBlock, { localVue, mocks, propsData, stubs, ...options })
}

describe('Component - DruxtBlockViewsBlock', () => {
  test('default', async () => {
    const wrapper = mountComponent(mockBlock)

    await localVue.nextTick()

    expect(wrapper.vm.uuid).toBe('uuid')

    expect(wrapper.vm.props).toStrictEqual({
      displayId: 'display_id',
      uuid: 'uuid',
      viewId: 'view_id'
    })
  })
})

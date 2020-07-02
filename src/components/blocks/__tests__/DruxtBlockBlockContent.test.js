import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtBlockBlockContent } from '..'

// Setup local vue instance.
const localVue = createLocalVue()
const stubs = ['druxt-entity']

const mockBlock = {
  id: 'test-block',
  attributes: {
    dependencies: {
      content: ['plugin:plugin_id:uuid']
    }
  }
}

const mountComponent = (entity, options = {}) => {
  const propsData = { block: entity }

  return mount(DruxtBlockBlockContent, { localVue, propsData, stubs, ...options })
}

describe('Component - DruxtBlockBlockContent', () => {
  test('default', async () => {
    const wrapper = mountComponent(mockBlock)

    expect(wrapper.vm.props).toStrictEqual({
      type: 'plugin--plugin_id',
      uuid: 'uuid'
    })
  })
})

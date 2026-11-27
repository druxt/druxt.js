import { createLocalVue, mount } from '@vue/test-utils'
import { getMockResource } from 'druxt-test-utils'

import { DruxtEntityMixin } from '../../src/mixins/entity'

// Setup local vue instance.
const localVue = createLocalVue()

const component = {
  name: 'DruxtEntityTest',
  mixins: [DruxtEntityMixin],
  render: () => ({})
}

describe('DruxtEntityMixin', () => {
  test('classes', async () => {
    const entity = await getMockResource('node--page')
    const schema = require('../../../../test/__fixtures__/schemas/node--page--default--view.json')

    const propsData = { entity, fields: {}, schema }

    const wrapper = mount(component, { localVue, propsData })

    expect(wrapper.vm.classes).toBe('node--page--default--view node--page node page default view')
  })

  test('model follows a new value', async () => {
    const value = { id: '1', attributes: { title: 'First' } }
    const wrapper = mount(component, { localVue, propsData: { value } })
    expect(wrapper.vm.model).toBe(value)

    // DruxtEntity hands its wrapper a new object when the stored entity changes.
    const next = { id: '1', attributes: { title: 'Stored' } }
    await wrapper.setProps({ value: next })
    expect(wrapper.vm.model).toBe(next)
  })
})

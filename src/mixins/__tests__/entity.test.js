import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtEntityMixin } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()

const component = {
  name: 'DruxtEntityTest',
  mixins: [DruxtEntityMixin],
  render: () => ({})
}

describe('DruxtEntityMixin', () => {
  test('classes', () => {
    const entity = require('../../__fixtures__/fe00c55d-0335-49d6-964e-a868c0c68f9c.json').data
    const schema = require('../../__fixtures__/pages--default--view.json')

    const propsData = { entity, fields: {}, schema }

    const wrapper = mount(component, { localVue, propsData })

    expect(wrapper.vm.classes).toBe('pages--default--view node--page node page default view')
  })
})

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
    const entity = require('../../__fixtures__/get/382eec1563f0514319a9de3a48cb658b.json').data
    const schema = require('../../__fixtures__/schemas/node--page--default--view.json')

    const propsData = { entity, fields: {}, schema }

    const wrapper = mount(component, { localVue, propsData })

    expect(wrapper.vm.classes).toBe('node--page--default--view node--page node page default view')
  })
})

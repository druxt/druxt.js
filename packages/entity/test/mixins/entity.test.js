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
})

import { createLocalVue, mount } from '@vue/test-utils'
import { getMockResource } from 'druxt-test-utils'

import DruxtField from '../../src/components/DruxtField.vue'
import { DruxtFieldMixin } from '../../src/mixins/field'

// Setup local vue instance.
const localVue = createLocalVue()

const component = {
  name: 'DruxtFieldTest',
  mixins: [DruxtFieldMixin],
  render: () => '<div>{{ model }}</div>',
}

describe('DruxtFieldMixin', () => {
  test('items - field', async () => {
    const entity = (await getMockResource('node--page')).data
    const schema = require('../../../../test/__fixtures__/schemas/node--page--default--view.json')

    const propsData = {
      schema: {
        config: schema.config,
        ...schema.fields.find((o) => o.id === 'body'),
      },
      value: entity.attributes.body,
    }
    const wrapper = mount(component, { localVue, propsData })
    expect(wrapper.vm.items).toStrictEqual([entity.attributes.body])
    expect(wrapper.vm.items.length).toBe(1)
  })

  test('items - relationship', async () => {
    const entity = (await getMockResource('node--article')).data
    const schema = require('../../../../test/__fixtures__/schemas/node--article--card--view.json')

    const propsData = {
      relationship: true,
      schema: {
        config: schema.config,
        ...schema.fields.find((o) => o.id === 'field_media_image'),
      },
      value: entity.relationships.field_media_image,
    }
    const wrapper = mount(component, { localVue, propsData })
    expect(wrapper.vm.items).toStrictEqual([{
      mode: propsData.schema.settings.display.view_mode,
      type: propsData.value.data.type,
      uuid: propsData.value.data.id,
    }])
  })

  test('v-model', async () => {
    const entity = (await getMockResource('node--page')).data
    const schema = require('../../../../test/__fixtures__/schemas/node--page--default--view.json')

    const propsData = {
      schema: {
        config: schema.config,
        ...schema.fields.find((o) => o.id === 'body'),
      },
      value: entity.attributes.body,
    }
    const wrapper = mount(component, { localVue, propsData })

    // Watch - model
    expect(wrapper.vm.model).toBe(propsData.value)
    DruxtFieldMixin.watch.model.call({
      $emit: wrapper.vm.$emit,
      model: { test: true },
      value: { test: false },
    })
    expect(wrapper.emitted().input[0]).toStrictEqual([{ test: true }])

    // Watch - value
    const mock = {
      model: { test: true },
      value: { test: false },
    }
    DruxtFieldMixin.watch.value.call(mock)
    expect(mock.model).toBe(mock.value)
  })
})

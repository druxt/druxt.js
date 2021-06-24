import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtViewsFilterMixin } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()

const component = {
  name: 'DruxtViewsFilterTest',
  mixins: [DruxtViewsFilterMixin],
  render: () => ({})
}

test('DruxtViewsFilterMixin', async () => {
  const wrapper = mount(component, { localVue })
  expect(wrapper.vm.value).toStrictEqual(undefined)

  wrapper.vm.model = 'test'
  expect(wrapper.vm.model).toStrictEqual('test')

  await wrapper.vm.$nextTick()
  expect(wrapper.emitted().input[0]).toStrictEqual(['test'])
})

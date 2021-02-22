import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtViewsPagerMixin } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()

const component = {
  name: 'DruxtViewsPagerTest',
  mixins: [DruxtViewsPagerMixin],
  render: () => ({})
}

test('DruxtViewsPagerMixin', async () => {
  const wrapper = mount(component, { localVue })
  expect(wrapper.vm.value).toStrictEqual(0)

  wrapper.vm.model = 1
  expect(wrapper.vm.model).toStrictEqual(1)

  await wrapper.vm.$nextTick()
  expect(wrapper.emitted().input).toStrictEqual([[1]])
})

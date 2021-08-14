import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtViewsViewMixin } from '../../src'

// Setup local vue instance.
const localVue = createLocalVue()

const component = {
  name: 'DruxtViewTest',
  mixins: [DruxtViewsViewMixin],
  render: () => ({})
}

test('DruxtViewsViewMixin', async () => {
  const wrapper = mount(component, { localVue })
  expect(wrapper.vm.value).toStrictEqual({ page: null })

  wrapper.vm.model = { page:  1 }
  expect(wrapper.vm.model).toStrictEqual({ page: 1 })

  await wrapper.vm.$nextTick()
  expect(wrapper.emitted().input).toBeTruthy()
})

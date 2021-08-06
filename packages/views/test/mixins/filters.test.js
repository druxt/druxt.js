import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtViewsFiltersMixin } from '../../src/mixins/filters'

// Setup local vue instance.
const localVue = createLocalVue()

const component = {
  name: 'DruxtViewsFiltersTest',
  mixins: [DruxtViewsFiltersMixin],
  render: () => ({})
}

test('DruxtViewsFiltersMixin', async () => {
  const wrapper = mount(component, { localVue })
  expect(wrapper.vm.value).toStrictEqual({})

  wrapper.vm.model = { test: 1 }
  expect(wrapper.vm.model).toStrictEqual({ test: 1 })

  await wrapper.vm.$nextTick()
  expect(wrapper.emitted().input).toBeFalsy()
})

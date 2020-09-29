import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtSite } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

describe('Druxt component', () => {
  test('defaults', () => {
    const wrapper = mount(DruxtSite, { localVue })

    // Props.
    expect(wrapper.vm.module).toBe(undefined)
    expect(wrapper.vm.propsData).toStrictEqual(undefined)
    expect(wrapper.vm.wrapper.component).toBe(undefined)
  })
})

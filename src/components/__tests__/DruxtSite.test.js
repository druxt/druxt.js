import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtSite } from '../..'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

describe('Druxt component', () => {
  test('defaults', async () => {
    const wrapper = mount(DruxtSite, { localVue, stubs: ['Nuxt'] })
    await wrapper.vm.$options.fetch.call(wrapper.vm)

    // Druxt Component mixin.
    expect(wrapper.vm.component.is).toBe('DruxtWrapper')
    expect(wrapper.vm.component.options).toStrictEqual(['DruxtSiteDefault'])
  })
})

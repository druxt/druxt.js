import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtClient, DruxtStore } from 'druxt'

import { DruxtSiteMixin } from '../../src'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const component = {
  name: 'DruxtSiteTest',
  mixins: [DruxtSiteMixin],
  render: () => ({})
}

describe('DruxtSiteMixin', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()

    DruxtStore({ store })
    store.$druxt = new DruxtClient('https://demo-api.druxtjs.org', {})
  })

  test('defaults', () => {
    const propsData = { theme: 'umami' }
    const wrapper = mount(component, { localVue, propsData, store })

    expect(wrapper.vm.theme).toBe('umami')
    expect(wrapper.vm.regions).toStrictEqual([])
  })
})

import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouter, DruxtRouterComponent, DruxtRouterStore } from '..'

jest.mock('../router')

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

// Setup vuex store.
const store = new Vuex.Store()
DruxtRouterStore({ store })
store.$druxtRouter = () => new DruxtRouter('https://example.com')

test('DruxtRouterComponent', async () => {
  await store.dispatch('druxtRouter/get', '/')

  const wrapper = shallowMount(DruxtRouterComponent, { store, localVue })

  expect(wrapper.vm.title).toBe('Welcome to Contenta CMS!')

  expect(wrapper.vm.entity).toHaveProperty('id', '4eb8bcc1-3b2e-4663-89cd-b8ca6d4d0cc9')

  expect(wrapper.vm.route).toHaveProperty('label')
  expect(wrapper.vm.route).toHaveProperty('entity.uuid')
  expect(wrapper.vm.route).toHaveProperty('entity.type')
  expect(wrapper.vm.route).toHaveProperty('entity.bundle')
  expect(wrapper.vm.route).toHaveProperty('entity.canonical')
})

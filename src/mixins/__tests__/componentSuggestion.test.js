import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

import { DruxtRouter, DruxtRouterStore } from 'druxt-router'

import { DruxtEntityComponentSuggestionMixin } from '../..'

const baseURL = 'https://example.com'

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

let store

const component = {
  name: 'DruxtEntityTest',
  mixins: [DruxtEntityComponentSuggestionMixin],
  render: () => ({})
}

describe('DruxtEntityComponentSuggestionMixin', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtRouter = new DruxtRouter(baseURL, {})
    DruxtRouterStore({ store })
  })

  test('defaults', () => {
    const wrapper = mount(component, { localVue, store })

    expect(wrapper.vm.component).toBe('div')
    expect(wrapper.vm.suggestions).toStrictEqual([])
    expect(wrapper.vm.suggestionRules).toStrictEqual([])
    expect(wrapper.vm.tokenContext).toHaveProperty('route', {})
    expect(wrapper.vm.tokenContext).toHaveProperty('tokens')
    expect(wrapper.vm.tokenType).toBe(false)
  })

  test('suggestion rules', () => {
    const mocks = {
      $druxtEntity: { options: { entity: { suggestions: [
        { type: false, value: ctx => 'DruxtEntityOptionsFunction' },
        { type: false, value: ctx => false },
        { value: 'DruxtEntityOptionsNoMatch' }
      ] } } },
      suggestionDefaults: [{
        value: 'SuggestionDefaultsString'
      }]
    }
    const wrapper = mount(component, { localVue, mocks, store })

    expect(wrapper.vm.suggestionRules.length).toBe(3)
    expect(wrapper.vm.suggestionRules[2].value).toBe('SuggestionDefaultsString')

    expect(wrapper.vm.suggestions.length).toBe(2)
    expect(wrapper.vm.suggestions).toStrictEqual([
      'DruxtEntityOptionsFunction',
      'SuggestionDefaultsString'
    ])
  })

  test('suggest', () => {
    const wrapper = mount(component, { localVue, store })

    expect(wrapper.vm.suggest('field')).toBe('Field')
    expect(wrapper.vm.suggest('field_name')).toBe('FieldName')
    expect(wrapper.vm.suggest('node--page')).toBe('NodePage')
    expect(wrapper.vm.suggest('node--page--field_name')).toBe('NodePageFieldName')
  })
})

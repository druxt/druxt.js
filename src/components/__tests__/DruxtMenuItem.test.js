import { config, createLocalVue, shallowMount,  } from '@vue/test-utils'
import Vuex from 'vuex'
import mockAxios from 'jest-mock-axios'

import { DruxtMenu, DruxtMenuComponent, DruxtMenuItemComponent, DruxtMenuStore } from '../..'

jest.mock('axios')

const baseURL = 'https://demo-api.druxtjs.org'

const propsData = {
  item: {
    entity: {
      attributes: {
        title: 'Parent',
        link: {
          uri: 'internal:/parent'
        }
      }
    },
    children: [{
      entity: {
        attributes: {
          title: 'Child',
          link: {
            uri: 'entity:node/1'
          }
        }
      },
      children: []
    }]
  }
}

const stubs = ['nuxt-link']

// Setup local vue instance.
const localVue = createLocalVue()
localVue.use(Vuex)

const mountComponent = options => {
  config.mocks.$route = {
    path: '/'
  }

  return shallowMount(DruxtMenuItemComponent, {
    localVue,
    propsData,
    parentComponent: DruxtMenuComponent,
    ...options
  })
}

let store

describe('DruxtMenuItem', () => {
  beforeEach(() => {
    // Setup vuex store.
    store = new Vuex.Store()
    store.$druxtMenu = new DruxtMenu(baseURL, {})
    DruxtMenuStore({ store })
    config.mocks.$store = store
  })

  test('default', () => {
    const wrapper = mountComponent()
    // Ensure we get sane default HTML.
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.vm.to).toStrictEqual({
      path: '/parent',
      type: 'internal'
    })
  })

  test('unwrapped', () => {
    const wrapper = mountComponent({ parentComponent: null })
    // Ensure unwrapped instance of `<druxt-menu-item />` doesn't render.
    expect(wrapper.html()).toBe('')
  })
})

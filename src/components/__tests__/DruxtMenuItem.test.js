import { shallowMount, createLocalVue } from '@vue/test-utils'

import { DruxtMenuItemComponent } from '../..'

const propsData = {
  item: {
    entity: {
      attributes: {
        title: 'Parent',
        url: '/parent'
      }
    },
    children: [{
      entity: {
        attributes: {
          title: 'Child',
          url: '/parent/child'
        }
      },
      children: []
    }]
  }
}

const stubs = ['nuxt-link']

// Setup local vue instance.
const localVue = createLocalVue()

describe('DruxtMenuItem', () => {
  test('default', async () => {
    shallowMount(DruxtMenuItemComponent, { localVue, propsData, stubs })
  })
})

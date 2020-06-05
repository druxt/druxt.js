import { createLocalVue, mount } from '@vue/test-utils'

import { DruxtView } from '..'

// Setup local vue instance.
const localVue = createLocalVue()

const mountComponent = () => {
  const propsData = {
    display: 'page_1',
    view: 'featured_articles'
  }
  return mount(DruxtView, { localVue, propsData })
}

describe('Component - DruxtView', () => {
  test('pages', async () => {
    const wrapper = mountComponent()

    expect(wrapper.vm).toHaveProperty('display')
    expect(wrapper.vm).toHaveProperty('view')
  })
})

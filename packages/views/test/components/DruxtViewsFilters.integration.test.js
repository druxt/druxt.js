import 'regenerator-runtime/runtime'

import { mountView } from '../utils/mountView'

// The recipes view, as Umami lists it at /recipes, four to a page with the
// views-recipes-difficulty overlay.
const recipes = { displayId: 'page_1', viewId: 'recipes' }

describe('DruxtViewsFilters, mounted in a DruxtView against the mock', () => {
  test('renders recipes page_1 with no filter, from one request', async () => {
    const { wrapper, requests, flush } = await mountView({ propsData: recipes })
    await flush()

    expect(requests()).toStrictEqual([{ search: '', status: 200 }])
    expect(wrapper.vm.results.map((result) => result.attributes.drupal_internal__nid)).toStrictEqual([10, 9, 8, 7])
  })
})

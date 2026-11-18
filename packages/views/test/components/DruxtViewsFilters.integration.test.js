import 'regenerator-runtime/runtime'

import { mountView } from '../utils/mountView'

// The recipes view, as Umami lists it at /recipes.
const recipes = { displayId: 'page_1', viewId: 'recipes' }

describe('DruxtViewsFilters, mounted in a DruxtView against the mock', () => {
  test('renders recipes page_1 with no filter, from one request', async () => {
    const { wrapper, requests, flush } = await mountView({ propsData: recipes })
    await flush()

    expect(requests()).toStrictEqual([{ search: '', status: 200 }])
    expect(wrapper.vm.results).toHaveLength(10)
  })
})

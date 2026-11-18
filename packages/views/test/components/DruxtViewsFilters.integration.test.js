import 'regenerator-runtime/runtime'

import { mountView } from '../utils/mountView'
import DruxtViewsFiltersBasic from './fixtures/DruxtViewsFiltersBasic.vue'

const { drupal } = require('../../../../test/drupal')

// The recipes view, as Umami lists it at /recipes. The views-recipes-difficulty
// overlay exposes its Difficulty field as a filter and lists four to a page.
const recipes = { displayId: 'page_1', viewId: 'recipes' }

// The query DruxtView sends for each Difficulty value, as qs writes it.
const difficulty = (value) => `views-filter${encodeURIComponent('[difficulty]')}=${value}`
const easy = difficulty('easy')
const medium = difficulty('medium')
const cleared = difficulty('')

// Umami's recipes by node ID, newest first: nodes 3, 4, 5 and 9 are easy, the
// rest medium.
const nodeIds = (wrapper) => wrapper.vm.results.map((result) => result.attributes.drupal_internal__nid)
const allFirstPage = [10, 9, 8, 7]
const easyRecipes = [9, 5, 4, 3]
const mediumFirstPage = [10, 8, 7, 6]

// Sets a filter the way a visitor does: the filter's own component emits
// `input`, and DruxtViewsFilters takes it from there.
const setFilter = (wrapper, value) => wrapper
  .findComponent({ name: 'DruxtViewsFilter' })
  .vm.$emit('input', value)

describe('DruxtViewsFilters, mounted in a DruxtView against the mock', () => {
  test('renders recipes page_1 with no filter, from one request', async () => {
    const { wrapper, requests, flush } = await mountView({ propsData: recipes })
    await flush()

    expect(requests()).toStrictEqual([{ search: '', status: 200 }])
    expect(nodeIds(wrapper)).toStrictEqual(allFirstPage)
  })

  describe('auto apply, with the default DruxtWrapper', () => {
    test('one request per filter change', async () => {
      const { wrapper, requests, flush } = await mountView({ propsData: recipes })
      await flush()

      setFilter(wrapper, 'easy')
      await flush()

      expect(requests().slice(1)).toStrictEqual([{ search: easy, status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual(easyRecipes)
    })

    // Pins today's behaviour: a cleared filter comes back up from
    // DruxtViewsFilter as an empty value, which Drupal answers with no results.
    // #1005 changes this.
    test('back to any', async () => {
      const { wrapper, requests, flush } = await mountView({ propsData: recipes })
      await flush()
      setFilter(wrapper, 'easy')
      await flush()

      setFilter(wrapper, undefined)
      await flush()

      expect(requests().slice(2)).toStrictEqual([{ search: cleared, status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual([])
    })
  })

  describe('manual apply, with a DruxtViewsFiltersBasic wrapper', () => {
    const components = { DruxtViewsFiltersBasic }

    test('no request until Apply', async () => {
      const { wrapper, requests, flush } = await mountView({ propsData: recipes, components })
      await flush()

      setFilter(wrapper, 'medium')
      await flush()

      expect(requests()).toStrictEqual([{ search: '', status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual(allFirstPage)
    })

    test('Apply sends one request', async () => {
      const { wrapper, requests, flush } = await mountView({ propsData: recipes, components })
      await flush()
      setFilter(wrapper, 'medium')
      await flush()

      await wrapper.find('[data-test=apply]').trigger('click')
      await flush()

      expect(requests().slice(1)).toStrictEqual([{ search: medium, status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual(mediumFirstPage)
    })
  })

  describe('filters from the URL', () => {
    // /recipes?filter[difficulty]=easy, as Vue Router parses it: flat, for
    // DruxtView to nest.
    const fromUrl = { 'filter[difficulty]': 'easy' }

    test('the first request carries the filter, and the parent sees no input', async () => {
      const { wrapper, requests, inputs, flush } = await mountView({
        propsData: recipes,
        query: fromUrl,
      })
      await flush()

      expect(requests()).toStrictEqual([{ search: easy, status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual(easyRecipes)
      expect(inputs).toStrictEqual([])
    })

    // Pins today's behaviour, as 'back to any' does. #1005 changes this.
    test('clearing the URL sends one request, with the filter empty', async () => {
      const { wrapper, requests, inputs, flush, setQuery } = await mountView({
        propsData: recipes,
        query: fromUrl,
      })
      await flush()

      setQuery({})
      await flush()

      expect(requests().slice(1)).toStrictEqual([{ search: cleared, status: 200 }])
      expect(nodeIds(wrapper)).toStrictEqual([])
      // DruxtView's own model is reset, and it emits it to its parent.
      expect(inputs).toStrictEqual([{ filter: { difficulty: null }, page: null, sort: null }])
    })
  })

  // Pins today's behaviour: a filter change keeps the page, so it asks for a
  // page the filtered results do not reach. See #ISSUE_PAGE.
  test('a filter change on page 2', async () => {
    const { wrapper, requests, flush } = await mountView({ propsData: recipes, query: { page: '1' } })
    await flush()

    setFilter(wrapper, 'easy')
    await flush()

    expect(requests().slice(1)).toStrictEqual([{ search: `page=1&${easy}`, status: 200 }])
    expect(nodeIds(wrapper)).toStrictEqual([])
  })

  test('a parent binding DruxtViewsFilters with v-model', async () => {
    const view = drupal.handle('GET', `/en/jsonapi/view/view?filter${encodeURIComponent('[drupal_internal__id]')}=recipes`)
    const filter = view.body.data[0].attributes.display.default.display_options.filters.field_difficulty_value

    const { root, inputs, flush } = await mountView({
      propsData: { filters: [filter] },
      parent: {
        template: '<DruxtViewsFilters v-model="model" v-bind="props" @input="onInput" />',
        data: () => ({ model: {} }),
      },
    })
    await flush()

    await root.setData({ model: { difficulty: 'easy' } })
    await flush()

    // Pins today's behaviour: the parent hears its own value back twice, once
    // from DruxtViewsFilters and once more when the DruxtViewsFilter it passed
    // the value down to emits it up again. #1005 changes this.
    expect(inputs).toStrictEqual([{ difficulty: 'easy' }, { difficulty: 'easy' }])
  })
})

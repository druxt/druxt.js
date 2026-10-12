import {
  fromAlias,
  modelToLocation,
  normalizePage,
  routeName,
  routeToModel,
  toAlias,
} from '../../src/utils/pages'

const pattern = '/shop/:collection?/:colour?'
const page = normalizePage(pattern, {
  viewId: 'products',
  displayId: 'page_1',
  arguments: ['collection'],
  filters: { brand: { query: 'brand' }, colour: { param: 'colour', multiple: true } },
  aliases: {
    collection: { women: '12', books: '11+12+13' },
    brand: { centarro: '3' },
  },
})

describe('normalizePage', () => {
  test('fills the defaults', () => {
    expect(normalizePage('/x', { viewId: 'a' })).toEqual({
      pattern: '/x',
      viewId: 'a',
      displayId: 'default',
      arguments: [],
      filters: {},
      page: 'page',
      sort: 'sort',
      history: 'replace',
      aliases: {},
    })
    expect(normalizePage('/x', { history: 'push' }).history).toBe('push')
    expect(normalizePage('/x', { history: 'other' }).history).toBe('replace')
  })
})

describe('aliases', () => {
  test('map both ways and pass unknown values through', () => {
    expect(fromAlias(page, 'collection', 'women')).toBe('12')
    expect(fromAlias(page, 'collection', '99')).toBe('99')
    expect(fromAlias(page, 'nothing', 'x')).toBe('x')
    expect(toAlias(page, 'collection', '12')).toBe('women')
    expect(toAlias(page, 'collection', 99)).toBe('99')
    expect(toAlias(page, 'nothing', 'x')).toBe('x')
  })
})

describe('routeToModel', () => {
  test('reads arguments, filters, page and sort through the aliases', () => {
    expect(
      routeToModel(page, {
        params: { collection: 'women', colour: 'red+blue' },
        query: { brand: 'centarro', sort: 'created', page: '2' },
      })
    ).toEqual({
      arguments: ['12'],
      filter: { brand: '3', colour: ['red', 'blue'] },
      page: 2,
      sort: 'created',
    })
  })

  test('a path filter of all is absent', () => {
    expect(routeToModel(page, { params: { collection: 'all', colour: 'all' }, query: {} })).toEqual({
      arguments: ['all'],
      filter: {},
      page: null,
      sort: null,
    })
  })

  test('sends all for a missing argument and leaves absent filters out', () => {
    expect(routeToModel(page, { params: {}, query: {} })).toEqual({
      arguments: ['all'],
      filter: {},
      page: null,
      sort: null,
    })
    expect(routeToModel(page, {}).arguments).toEqual(['all'])
  })

  test('keeps an array filter value', () => {
    const model = routeToModel(page, {
      params: {},
      query: { brand: ['centarro', '4'] },
    })
    expect(model.filter.brand).toEqual(['3', '4'])
  })
})

describe('modelToLocation', () => {
  test('writes params and query with aliases and drops empties', () => {
    expect(
      modelToLocation(page, pattern, {
        arguments: ['12'],
        filter: { brand: '3', colour: '' },
        page: 2,
        sort: null,
      })
    ).toEqual({ path: '/shop/women', query: { brand: 'centarro', page: '2' } })
  })

  test('a later segment keeps its place with all before it, several values join, page 0 is dropped', () => {
    expect(
      modelToLocation(page, pattern, {
        arguments: ['all'],
        filter: { colour: ['red', 'blue'] },
        page: 0,
        sort: 'created',
      })
    ).toEqual({ path: '/shop/all/red+blue', query: { sort: 'created' } })
    expect(
      modelToLocation(page, pattern, { arguments: ['12'], filter: {}, page: null, sort: null })
    ).toEqual({ path: '/shop/women', query: {} })
  })

  test('keeps query keys the page does not own and an array value', () => {
    expect(
      modelToLocation(
        page,
        '/shop/:collection?',
        {
          arguments: ['11+12+13'],
          filter: { brand: ['3', '4'] },
          page: null,
          sort: null,
        },
        { query: { utm: 'x', brand: 'old', page: '9' } }
      )
    ).toEqual({
      path: '/shop/books',
      query: { utm: 'x', brand: ['centarro', '4'] },
    })
  })

  test('a pattern with nothing left is the root', () => {
    expect(
      modelToLocation(normalizePage('/:a?', { arguments: ['a'] }), '/:a?', {
        arguments: ['all'],
      })
    ).toEqual({
      path: '/',
      query: {},
    })
  })
})

describe('routeName', () => {
  test('slugs the pattern', () => {
    expect(routeName('/shop/:collection?')).toBe('druxt-views-page-shop-collection')
    expect(routeName('/')).toBe('druxt-views-page-index')
  })
})

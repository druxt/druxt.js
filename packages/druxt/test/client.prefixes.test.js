import { DruxtClient } from '../src/client'

const { stubLanguages } = require('../../../test/languages')

const baseUrl = 'https://languages.test'

describe('a client with the languages\' prefixes', () => {
  let site
  afterEach(() => site.restore())

  test('a langcode reaches Drupal under its configured prefix', async () => {
    site = stubLanguages({ baseUrl, prefixes: { en: '', es: 'spanish' } })
    const druxt = new DruxtClient(baseUrl, { prefixes: { en: '', es: 'spanish' } })

    expect(druxt.urlPrefix('es')).toBe('spanish')
    expect(druxt.urlPrefix('en')).toBe('')
    expect(druxt.urlPrefix('fr')).toBe('fr')
    expect(druxt.urlPrefix()).toBe('')

    expect((await druxt.getIndex('configurable_language--configurable_language', 'es')).href).toBe('/spanish/jsonapi/configurable_language/configurable_language')
    expect((await druxt.getIndex('configurable_language--configurable_language', 'en')).href).toBe('/jsonapi/configurable_language/configurable_language')
    expect(site.urls()).toStrictEqual(['/spanish/jsonapi', '/jsonapi'])
  })

  test('a View, which the index does not list, is under the configured prefix too', async () => {
    site = stubLanguages({ baseUrl, prefixes: { en: '', es: 'spanish' } })
    const druxt = new DruxtClient(baseUrl, { prefixes: { en: '', es: 'spanish' } })
    druxt.index.spanish = {}
    druxt.index[''] = {}
    druxt.get = jest.fn(async () => ({ data: {} }))

    await druxt.getResource('views--recipes', 'block', undefined, 'es')
    await druxt.getRelated('views--recipes', 'block', 'field', undefined, 'es')
    await druxt.getResource('views--recipes', 'block', undefined, 'en')
    expect(druxt.get.mock.calls.map(([url]) => url)).toStrictEqual([
      '/spanish/jsonapi/views/recipes/block',
      '/spanish/jsonapi/views/recipes/block/field',
      '/jsonapi/views/recipes/block',
    ])
  })

  test('without the map, a langcode is the prefix, as before', async () => {
    site = stubLanguages({ baseUrl, prefixes: { en: 'en', es: 'es' } })
    const druxt = new DruxtClient(baseUrl)
    expect(druxt.urlPrefix('es')).toBe('es')
    await druxt.getIndex(undefined, 'es')
    expect(site.urls()).toStrictEqual(['/es/jsonapi'])
  })
})

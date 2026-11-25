import { DruxtClient } from '../src/client'

const { stubLanguages } = require('../../../test/languages')

const baseUrl = 'https://languages.test'

describe('a client with the languages\' prefixes', () => {
  let site
  afterEach(() => site.restore())
  // Clients on one Axios instance share the index, so each test starts without the last one's site.
  beforeEach(() => new DruxtClient(baseUrl).clearCache())

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

  test('an index cached with another prefix\'s links keeps to the prefix it was asked at', async () => {
    // Drupal's Dynamic Page Cache gives /es/jsonapi the links of /jsonapi.
    site = stubLanguages({ baseUrl, prefixes: { en: '', es: 'es' }, cachedAs: { es: '' } })
    const druxt = new DruxtClient(baseUrl, { prefixes: { en: '', es: 'es' } })
    expect((await druxt.getIndex('configurable_language--configurable_language', 'es')).href).toBe('/es/jsonapi/configurable_language/configurable_language')
  })

  test('a prefix that starts with the endpoint\'s name is a prefix, not the endpoint', () => {
    const druxt = new DruxtClient(baseUrl, { prefixes: { en: '', es: 'jsonapi-es' } })
    expect(druxt.atPrefix('/jsonapi-es/jsonapi/node/article', 'jsonapi-es')).toBe('/jsonapi-es/jsonapi/node/article')
    expect(druxt.atPrefix('/jsonapi-es/jsonapi/node/article', '')).toBe('/jsonapi/node/article')
    expect(druxt.atPrefix('/jsonapi/node/article', 'jsonapi-es')).toBe('/jsonapi-es/jsonapi/node/article')
  })

  test('a prefix named like the endpoint is a prefix when the endpoint follows it', () => {
    const druxt = new DruxtClient(baseUrl, { prefixes: { en: '', es: 'jsonapi' } })
    expect(druxt.atPrefix('/jsonapi/jsonapi/node/article', 'jsonapi')).toBe('/jsonapi/jsonapi/node/article')
    expect(druxt.atPrefix('/jsonapi/jsonapi/node/article', '')).toBe('/jsonapi/node/article')
    expect(druxt.atPrefix('/jsonapi/node/article', 'jsonapi')).toBe('/jsonapi/jsonapi/node/article')
    expect(druxt.atPrefix('/jsonapi/node/article', '')).toBe('/jsonapi/node/article')
  })

  test('clients with different prefixes on one Axios instance keep their own indexes', async () => {
    // Drupal's Dynamic Page Cache gives /es/jsonapi the links of /jsonapi.
    site = stubLanguages({ baseUrl, prefixes: { en: '', es: 'es' }, cachedAs: { es: '' } })
    const plain = new DruxtClient(baseUrl)
    await plain.getIndex(undefined, 'es')
    const mapped = new DruxtClient(baseUrl, { axios: plain.axios, prefixes: { en: '', es: 'es' } })
    expect((await mapped.getIndex('configurable_language--configurable_language', 'es')).href).toBe('/es/jsonapi/configurable_language/configurable_language')
  })

  test('a request without a langcode goes to the default language, under its prefix', async () => {
    // Drupal links an unprefixed index under the default language's prefix, and a request there asks for that language
    // whatever else Drupal would negotiate.
    site = stubLanguages({ baseUrl, prefixes: { en: 'en', es: 'es' } })
    const druxt = new DruxtClient(baseUrl, { prefixes: { en: 'en', es: 'es' }, defaultLangcode: 'en' })
    expect(druxt.urlPrefix()).toBe('en')
    expect(druxt.urlPrefix('es')).toBe('es')
    expect((await druxt.getIndex('configurable_language--configurable_language')).href).toBe('/en/jsonapi/configurable_language/configurable_language')
    expect(site.urls()).toStrictEqual(['/en/jsonapi'])
  })

  test('without the default language, a request without a langcode is unprefixed', () => {
    const druxt = new DruxtClient(baseUrl, { prefixes: { en: 'en', es: 'es' } })
    expect(druxt.urlPrefix()).toBe('')
  })

  test('a prefix named like an object property still fetches its index', async () => {
    site = stubLanguages({ baseUrl, prefixes: { en: '', es: 'constructor' } })
    const druxt = new DruxtClient(baseUrl, { prefixes: { en: '', es: 'constructor' } })
    expect((await druxt.getIndex('configurable_language--configurable_language', 'es')).href).toBe('/constructor/jsonapi/configurable_language/configurable_language')
  })

  test('without the map, a langcode is the prefix, as before', async () => {
    site = stubLanguages({ baseUrl, prefixes: { en: 'en', es: 'es' } })
    const druxt = new DruxtClient(baseUrl)
    expect(druxt.urlPrefix('es')).toBe('es')
    await druxt.getIndex(undefined, 'es')
    expect(site.urls()).toStrictEqual(['/es/jsonapi'])
  })
})

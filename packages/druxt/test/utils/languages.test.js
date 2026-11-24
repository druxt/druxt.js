import consola from 'consola'
import { DruxtClient } from '../../src/client'
import { getLanguages } from '../../src/utils/languages'

const { stubLanguages } = require('../../../../test/languages')

const baseUrl = 'https://languages.test'

let site
afterEach(() => site && site.restore())

// A client of its own, without the index another test's site left.
const client = (url = baseUrl) => {
  const druxt = new DruxtClient(url)
  druxt.clearCache()
  return druxt
}
const read = () => getLanguages(client(), { endpoint: '/jsonapi' })

describe('getLanguages()', () => {
  test('a default language without a prefix, and another under its langcode', async () => {
    site = stubLanguages({ baseUrl, prefixes: { en: '', es: 'es' } })
    expect(await read()).toStrictEqual([
      { langcode: 'en', prefix: '', default: true },
      { langcode: 'es', prefix: 'es' },
    ])
  })

  test('a default language under a prefix of its own', async () => {
    site = stubLanguages({ baseUrl, prefixes: { en: 'english', es: 'es' } })
    expect(await read()).toStrictEqual([
      { langcode: 'en', prefix: 'english', default: true },
      { langcode: 'es', prefix: 'es' },
    ])
  })

  test('a prefix that is not the langcode, from decoupled settings, with no probe', async () => {
    site = stubLanguages({ baseUrl, prefixes: { en: '', es: 'spanish' }, decoupled: true })
    expect(await read()).toStrictEqual([
      { langcode: 'en', prefix: '', default: true },
      { langcode: 'es', prefix: 'spanish' },
    ])
    expect(site.urls()).not.toContain('/es/jsonapi')
  })

  test('an index cached with another prefix\'s links still reads each prefix', async () => {
    const warn = jest.spyOn(consola, 'warn').mockImplementation(() => {})
    // The unprefixed index cached from /es/jsonapi, and /es/jsonapi's from /jsonapi.
    site = stubLanguages({ baseUrl, prefixes: { en: '', es: 'es' }, cachedAs: { '': 'es', es: '' } })
    try {
      expect(await read()).toStrictEqual([
        { langcode: 'en', prefix: '', default: true },
        { langcode: 'es', prefix: 'es' },
      ])
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  test('a prefix that cannot be read is taken to be the langcode, with a warning', async () => {
    const warn = jest.spyOn(consola, 'warn').mockImplementation(() => {})
    site = stubLanguages({ baseUrl, prefixes: { en: '', es: 'spanish' } })
    try {
      expect(await read()).toStrictEqual([
        { langcode: 'en', prefix: '', default: true },
        { langcode: 'es', prefix: 'es' },
      ])
      expect(warn.mock.calls.join(' ')).toContain("'es'")
    } finally {
      warn.mockRestore()
    }
  })

  test('one build reads once', async () => {
    site = stubLanguages({ baseUrl, prefixes: { en: '', es: 'es' } })
    const build = {}
    const first = await getLanguages(client(), { build })
    const requests = site.urls().length
    expect(await getLanguages(client(), { build })).toBe(first)
    expect(site.urls().length).toBe(requests)
  })

  test('a site without the language module has no languages', async () => {
    site = stubLanguages({ baseUrl, prefixes: { en: '' }, multilingual: false })
    expect(await read()).toStrictEqual([])
    expect(site.urls()).toStrictEqual(['/jsonapi'])
  })

  test('a Drupal whose endpoint does not answer has no languages, with a warning', async () => {
    const warn = jest.spyOn(consola, 'warn').mockImplementation(() => {})
    site = stubLanguages({ baseUrl, prefixes: { en: '' }, down: true })
    try {
      expect(await read()).toStrictEqual([])
      expect(warn).toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  test('the Umami mock serves every language under its langcode', async () => {
    const languages = await getLanguages(client('https://api.umami.demo.druxtjs.org'), { endpoint: '/jsonapi' })
    expect(languages.map(({ langcode, prefix }) => [langcode, prefix])).toStrictEqual([['en', 'en'], ['es', 'es']])
  })
})
